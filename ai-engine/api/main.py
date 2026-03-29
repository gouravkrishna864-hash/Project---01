"""
REOS AI Engine
FastAPI microservice exposing all AI capabilities:
  - /recommend    — Personalized property recommendations
  - /lead-score   — AI lead scoring
  - /price-trend  — Price intelligence & fair value estimation
  - /search       — NLP smart search parsing
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from recommendation.recommender import RecommendationEngine
from lead_scoring.lead_scorer import LeadScoringEngine
from pricing.price_intelligence import PriceIntelligenceEngine
from nlp.smart_search import SmartSearchParser

app = FastAPI(
    title="REOS AI Engine",
    description="Real Estate Operating System — AI microservice",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Engine singletons ───────────────────────────────────────────────────────
recommender = RecommendationEngine()
lead_scorer = LeadScoringEngine()
price_engine = PriceIntelligenceEngine()
search_parser = SmartSearchParser()


# ─── Schemas ─────────────────────────────────────────────────────────────────
class RecommendRequest(BaseModel):
    user_id: str
    preferences: Optional[dict] = {}
    city: Optional[str] = None
    limit: int = 10


class LeadScoreRequest(BaseModel):
    user_id: str
    property_id: str
    budget: Optional[int] = None
    user_preferences: Optional[dict] = {}


class PriceTrendRequest(BaseModel):
    city: str
    locality: Optional[str] = None
    type: Optional[str] = "apartment"
    bedrooms: Optional[int] = 2


class SearchRequest(BaseModel):
    query: str


# ─── Endpoints ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "service": "reos-ai-engine"}


@app.post("/recommend")
async def recommend(req: RecommendRequest):
    try:
        results = await recommender.get_recommendations(
            user_id=req.user_id,
            preferences=req.preferences or {},
            city=req.city,
            limit=req.limit,
        )
        return {"success": True, "data": results, "count": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/lead-score")
async def score_lead(req: LeadScoreRequest):
    try:
        result = await lead_scorer.score(
            user_id=req.user_id,
            property_id=req.property_id,
            budget=req.budget,
            preferences=req.user_preferences or {},
        )
        return {"success": True, **result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/price-trend")
async def price_trend(city: str, locality: str = None, type: str = "apartment", bedrooms: int = 2):
    try:
        result = await price_engine.get_trend(
            city=city, locality=locality, prop_type=type, bedrooms=bedrooms
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/price-estimate")
async def price_estimate(data: dict):
    try:
        result = await price_engine.estimate_fair_value(data)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/search/parse")
async def parse_search(req: SearchRequest):
    try:
        parsed = search_parser.parse(req.query)
        return {"success": True, "data": parsed}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
