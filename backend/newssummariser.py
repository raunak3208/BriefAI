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

