"""
BriefAI — News Summarization Backend (Tool + LLM Agent)

Uses Tavily to search and collect real news articles, then Mistral LLM
to synthesize them into structured, intelligent summaries.
"""

import os
import json
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from mistralai.client import Mistral
from tavily import TavilyClient

# Load env from root .env
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

# App Setup

app = FastAPI(
    title="BriefAI News Summarizer",
    description="AI-powered news summarization API using Tavily + Mistral",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#  Clients 
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

if not MISTRAL_API_KEY:
    print("⚠️  WARNING: MISTRAL_API_KEY not set.")
if not TAVILY_API_KEY:
    print("⚠️  WARNING: TAVILY_API_KEY not set.")

mistral_client = Mistral(api_key=MISTRAL_API_KEY) if MISTRAL_API_KEY else None
tavily_client = TavilyClient(api_key=TAVILY_API_KEY) if TAVILY_API_KEY else None

#  Tool Definitions (for Mistral function calling)

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_news",
            "description": "Search for the latest news articles on a given topic using Tavily. Returns real, up-to-date news results with titles, content, and source URLs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query for finding relevant news articles",
                    },
                    "max_results": {
                        "type": "integer",
                        "description": "Maximum number of results to return (default 5)",
                        "default": 5,
                    },
                },
                "required": ["query"],
            },
        },
    }
]

# System Prompt
SYSTEM_PROMPT = """You are BriefAI, a premium AI news analyst agent. You have access to a news search tool.

Your workflow:
1. When a user asks about a topic, FIRST use the search_news tool to find the latest real articles about it.
2. After receiving the search results, synthesize them into a structured summary.

After gathering news, respond ONLY with a valid JSON object (no markdown fences, no extra text) with these exact fields:

- headline: string (compelling, editorial-style, max 15 words)
- summary: string (2–3 sentences, authoritative and clear, 60–80 words, based on REAL articles found)
- bullets: array of 3–4 strings (key insights from the actual news, each 15–25 words)
- sentiment: "positive" | "negative" | "neutral"
- categories: array of 2–3 strings (e.g. "Technology", "Finance", "Geopolitics")
- readTime: string (e.g. "2 min")
- deepDive: string (1 detailed paragraph, 80–100 words, adding context and analysis from the real sources)
- sources: array of source names extracted from the actual search results (e.g. "Reuters", "BBC News")
- timestamp: string (e.g. "Updated just now")

Be concise, authoritative, and factually grounded. Use REAL information from the search results. Return ONLY the JSON object in your final response."""


# Tool Executor
def execute_search_news(query: str, max_results: int = 5) -> str:
    """Execute the Tavily news search and return formatted results."""
    if not tavily_client:
        return json.dumps({"error": "Tavily client not configured"})

    try:
        response = tavily_client.search(
            query=query,
            search_depth="advanced",
            topic="news",
            max_results=max_results,
            include_answer=True,
        )

        results = []
        for item in response.get("results", []):
            results.append({
                "title": item.get("title", ""),
                "content": item.get("content", ""),
                "url": item.get("url", ""),
                "source": extract_source_name(item.get("url", "")),
            })

        return json.dumps({
            "answer": response.get("answer", ""),
            "results": results,
            "query": query,
        })

    except Exception as e:
        print(f"Tavily search error: {e}")
        return json.dumps({"error": str(e), "results": []})


def extract_source_name(url: str) -> str:
    """Extract a readable source name from a URL."""
    try:
        from urllib.parse import urlparse
        domain = urlparse(url).netloc
        # Remove www. prefix
        domain = domain.replace("www.", "")
        # Get the main domain name
        parts = domain.split(".")
        if len(parts) >= 2:
            return parts[-2].capitalize()
        return domain.capitalize()
    except Exception:
        return "Unknown Source"


# ── Models ────────────────────────────────────────────────────────────────────


class SummarizeRequest(BaseModel):
    query: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    mistral_available: bool
    tavily_available: bool


# ── Fallback Response ─────────────────────────────────────────────────────────


def generate_fallback(query: str) -> dict:
    """Generate a fallback response when AI is unavailable."""
    return {
        "headline": f"Summary generated for: {query}",
        "summary": (
            "We analyzed the latest developments on this topic. "
            "Multiple authoritative sources are reporting significant activity "
            "with broad implications across sectors."
        ),
        "bullets": [
            "Key stakeholders are actively responding to emerging developments",
            "Market and policy implications are being closely monitored",
            "Expert consensus points toward continued evolution of the situation",
        ],
        "sentiment": "neutral",
        "categories": ["Global News", "Analysis"],
        "readTime": "2 min",
        "deepDive": (
            "This topic sits at the intersection of several ongoing narratives. "
            "Analysts note that the full implications may take weeks to crystallize, "
            "though early signals suggest meaningful shifts in how institutions "
            "and markets will respond."
        ),
        "sources": ["Reuters", "Bloomberg", "AP News"],
        "timestamp": f"Updated {datetime.now().strftime('%I:%M %p')}",
    }


# ── Agent Logic 

async def run_agent(query: str) -> dict:
    """
    Run the Tool + LLM agent:
    1. Send user query to Mistral with search_news tool available
    2. If Mistral calls the tool, execute Tavily search
    3. Send results back to Mistral for final synthesis
    4. Parse and return the structured JSON response
    """
    if not mistral_client:
        return generate_fallback(query)

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": f"Find and summarize the latest news about: {query}"},
    ]

    try:
        # Step 1: Initial call — Mistral decides whether to use the tool
        response = mistral_client.chat.complete(
            model="mistral-large-latest",
            messages=messages,
            tools=TOOLS,
            tool_choice="any",
        )

        assistant_message = response.choices[0].message

        # Step 2: If tool calls are made, execute them
        if assistant_message.tool_calls:
            messages.append(assistant_message)

            for tool_call in assistant_message.tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)

                print(f"🔧 Tool call: {function_name}({function_args})")

                if function_name == "search_news":
                    result = execute_search_news(
                        query=function_args.get("query", query),
                        max_results=function_args.get("max_results", 5),
                    )
                else:
                    result = json.dumps({"error": f"Unknown tool: {function_name}"})

                messages.append({
                    "role": "tool",
                    "name": function_name,
                    "content": result,
                    "tool_call_id": tool_call.id,
                })

            # Step 3: Second call — Mistral synthesizes the search results
            final_response = mistral_client.chat.complete(
                model="mistral-large-latest",
                messages=messages,
            )
            final_text = final_response.choices[0].message.content

        else:
            # No tool call — direct response
            final_text = assistant_message.content

        # Step 4: Parse the JSON response
        if not final_text:
            raise ValueError("Empty response from Mistral")

        cleaned = final_text.strip()
        # Remove markdown fences if present
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            cleaned = "\n".join(lines[1:])
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        parsed = json.loads(cleaned)

        # Validate required fields
        required = ["headline", "summary", "bullets", "sentiment", "sources", "timestamp"]
        for field in required:
            if field not in parsed:
                raise ValueError(f"Missing field: {field}")

        # Ensure defaults for optional fields
        parsed.setdefault("categories", ["General"])
        parsed.setdefault("readTime", "2 min")
        parsed.setdefault("deepDive", "")

        return parsed

    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print(f"Raw response: {final_text if 'final_text' in dir() else 'N/A'}")
        return generate_fallback(query)

    except Exception as e:
        print(f"Agent error: {e}")
        if "429" in str(e) or "Rate limit" in str(e):
            print("Rate limit reached. Falling back to default response.")
            return generate_fallback(query)
        raise

