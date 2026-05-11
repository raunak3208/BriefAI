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

