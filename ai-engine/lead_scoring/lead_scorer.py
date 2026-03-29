"""
REOS Lead Scoring Engine
Scores leads (0-100) to help brokers prioritize hot buyers.

Scoring factors:
  - Budget match vs property price           (30 pts)
  - Location preference match                (20 pts)
  - BHK preference match                     (15 pts)
  - User activity on platform                (20 pts)
  - Recency (how recently they engaged)      (15 pts)
"""
import os
from typing import Optional
import asyncpg
from datetime import datetime, timezone


class LeadScoringEngine:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")

    async def _fetch_property(self, conn, property_id: str) -> Optional[dict]:
        row = await conn.fetchrow(
            "SELECT id, price, city, locality, type, bedrooms FROM properties WHERE id = $1",
            property_id,
        )
        return dict(row) if row else None

    async def _fetch_user_activity(self, conn, user_id: str) -> dict:
        """Get user's recent platform activity metrics."""
        activity = await conn.fetchrow(
            """
            SELECT
                COUNT(DISTINCT l.property_id) AS properties_viewed,
                COUNT(DISTINCT l.id) AS total_leads,
                MAX(l.created_at) AS last_activity
            FROM leads l
            WHERE l.user_id = $1
            """,
            user_id,
        )
        return dict(activity) if activity else {}

    def _budget_score(self, user_budget: Optional[int], property_price: int) -> tuple[float, str]:
        """Score budget alignment. Max 30 pts."""
        if not user_budget:
            return 15.0, "no_budget_provided"
        ratio = user_budget / property_price
        if 0.9 <= ratio <= 1.3:
            return 30.0, "strong_budget_match"
        elif 0.7 <= ratio < 0.9:
            return 20.0, "slight_below_budget"
        elif 1.3 < ratio <= 2.0:
            return 25.0, "above_budget_comfortable"
        elif ratio < 0.7:
            return 5.0, "budget_too_low"
        else:
            return 10.0, "over_budget"

    def _location_score(self, preferences: dict, property_city: str, property_locality: str) -> tuple[float, str]:
        """Score location preference match. Max 20 pts."""
        preferred_cities = preferences.get("preferred_cities", [])
        preferred_localities = preferences.get("preferred_localities", [])

        if property_locality and any(loc.lower() in property_locality.lower() for loc in preferred_localities):
            return 20.0, "locality_match"
        if any(city.lower() == property_city.lower() for city in preferred_cities):
            return 14.0, "city_match"
        return 5.0, "no_location_preference"

    def _bhk_score(self, preferences: dict, property_bedrooms: Optional[int]) -> tuple[float, str]:
        """Score BHK preference match. Max 15 pts."""
        preferred_bhk = preferences.get("bedrooms") or preferences.get("bhk")
        if not preferred_bhk or not property_bedrooms:
            return 7.0, "no_bhk_preference"
        diff = abs(int(preferred_bhk) - property_bedrooms)
        if diff == 0:
            return 15.0, "exact_bhk_match"
        elif diff == 1:
            return 8.0, "close_bhk"
        return 2.0, "bhk_mismatch"

    def _activity_score(self, activity: dict) -> tuple[float, str]:
        """Score based on platform engagement. Max 20 pts."""
        total_leads = activity.get("total_leads", 0) or 0
        props_viewed = activity.get("properties_viewed", 0) or 0

        if total_leads == 0 and props_viewed == 0:
            return 2.0, "new_user"
        engagement = min(total_leads * 2 + props_viewed, 100) / 100
        return round(engagement * 20, 1), "active_user" if engagement > 0.5 else "moderate_user"

    def _recency_score(self, activity: dict) -> tuple[float, str]:
        """Score based on how recently the user was active. Max 15 pts."""
        last_activity = activity.get("last_activity")
        if not last_activity:
            return 3.0, "no_history"

        now = datetime.now(timezone.utc)
        if last_activity.tzinfo is None:
            last_activity = last_activity.replace(tzinfo=timezone.utc)
        days_ago = (now - last_activity).days

        if days_ago <= 1:
            return 15.0, "very_recent"
        elif days_ago <= 7:
            return 10.0, "recent"
        elif days_ago <= 30:
            return 6.0, "moderate"
        return 2.0, "inactive"

    async def score(
        self,
        user_id: str,
        property_id: str,
        budget: Optional[int],
        preferences: dict,
    ) -> dict:
        conn = await asyncpg.connect(self.db_url)
        try:
            property_data = await self._fetch_property(conn, property_id)
            activity = await self._fetch_user_activity(conn, user_id)
        finally:
            await conn.close()

        if not property_data:
            return {"score": 50, "priority": "warm", "factors": {}}

        budget_pts, budget_reason = self._budget_score(budget, property_data["price"])
        location_pts, loc_reason = self._location_score(preferences, property_data["city"], property_data.get("locality", ""))
        bhk_pts, bhk_reason = self._bhk_score(preferences, property_data.get("bedrooms"))
        activity_pts, activity_reason = self._activity_score(activity)
        recency_pts, recency_reason = self._recency_score(activity)

        total = round(budget_pts + location_pts + bhk_pts + activity_pts + recency_pts, 1)
        priority = "hot" if total >= 75 else "warm" if total >= 45 else "cold"

        return {
            "score": min(total, 100),
            "priority": priority,
            "factors": {
                "budget": {"score": budget_pts, "reason": budget_reason, "max": 30},
                "location": {"score": location_pts, "reason": loc_reason, "max": 20},
                "bhk": {"score": bhk_pts, "reason": bhk_reason, "max": 15},
                "activity": {"score": activity_pts, "reason": activity_reason, "max": 20},
                "recency": {"score": recency_pts, "reason": recency_reason, "max": 15},
            },
        }
