"""
REOS Recommendation Engine
Collaborative filtering + content-based hybrid recommendations.

Algorithm:
  1. Fetch user's behavioral history (views, interests) from DB
  2. Build user-property interaction matrix
  3. Use cosine similarity for user-to-user collaborative filtering
  4. Blend with content-based (budget, location, BHK match)
  5. Return ranked property IDs
"""
import os
import asyncio
from typing import Optional
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import asyncpg


class RecommendationEngine:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")

    async def _get_connection(self):
        return await asyncpg.connect(self.db_url)

    async def _fetch_user_interactions(self, conn, city: Optional[str]) -> list[dict]:
        """Fetch recent property interactions across all users."""
        query = """
            SELECT
                l.user_id,
                l.property_id,
                COUNT(*) AS interaction_count,
                MAX(l.created_at) AS last_interaction
            FROM leads l
            JOIN properties p ON l.property_id = p.id
            WHERE p.status = 'active'
            {city_filter}
            GROUP BY l.user_id, l.property_id
        """
        city_filter = "AND p.city ILIKE $1" if city else ""
        if city:
            rows = await conn.fetch(query.format(city_filter=city_filter), f"%{city}%")
        else:
            rows = await conn.fetch(query.format(city_filter=""))
        return [dict(r) for r in rows]

    async def _fetch_active_properties(self, conn, city: Optional[str], limit: int = 200) -> list[dict]:
        """Fetch active properties for scoring."""
        query = """
            SELECT id, title, city, locality, price, type, bedrooms,
                   is_featured, views_count, leads_count
            FROM properties
            WHERE status = 'active'
            {city_filter}
            ORDER BY is_featured DESC, leads_count DESC
            LIMIT $1
        """
        city_filter = "AND city ILIKE $2" if city else ""
        if city:
            rows = await conn.fetch(query.format(city_filter=city_filter), limit, f"%{city}%")
        else:
            rows = await conn.fetch(query.format(city_filter=""), limit)
        return [dict(r) for r in rows]

    def _build_interaction_matrix(self, interactions: list[dict], user_id: str) -> tuple[dict, dict, np.ndarray]:
        """Build user-property interaction matrix."""
        users = list({r["user_id"] for r in interactions})
        properties = list({r["property_id"] for r in interactions})

        user_idx = {u: i for i, u in enumerate(users)}
        prop_idx = {p: i for i, p in enumerate(properties)}

        matrix = np.zeros((len(users), len(properties)))
        for r in interactions:
            u = user_idx.get(r["user_id"])
            p = prop_idx.get(r["property_id"])
            if u is not None and p is not None:
                matrix[u][p] = float(r["interaction_count"])

        return user_idx, prop_idx, matrix

    def _collaborative_score(
        self,
        user_id: str,
        user_idx: dict,
        prop_idx: dict,
        matrix: np.ndarray,
        n: int = 10,
    ) -> list[tuple[str, float]]:
        """Return top-N property IDs by collaborative filtering score."""
        if user_id not in user_idx or matrix.shape[0] < 2:
            return []

        idx = user_idx[user_id]
        user_vec = matrix[idx].reshape(1, -1)
        sims = cosine_similarity(user_vec, matrix)[0]
        sims[idx] = 0  # exclude self

        # Weighted sum of property scores from similar users
        scores = np.dot(sims, matrix)
        # Zero out already-interacted properties
        scores[matrix[idx] > 0] = 0

        top_indices = np.argsort(scores)[::-1][:n]
        prop_id_map = {v: k for k, v in prop_idx.items()}
        return [(prop_id_map[i], float(scores[i])) for i in top_indices if scores[i] > 0]

    def _content_score(self, property: dict, preferences: dict) -> float:
        """Score a property by how well it matches user preferences (0–1)."""
        score = 0.0
        total = 0

        # Budget match
        budget = preferences.get("budget_max") or preferences.get("budget")
        if budget and property.get("price"):
            ratio = property["price"] / budget
            score += max(0, 1 - abs(1 - ratio))
            total += 1

        # BHK match
        preferred_bhk = preferences.get("bedrooms") or preferences.get("bhk")
        if preferred_bhk and property.get("bedrooms"):
            score += 1.0 if property["bedrooms"] == int(preferred_bhk) else 0.5
            total += 1

        # Featured bonus
        if property.get("is_featured"):
            score += 0.2
            total += 0.2

        # Popularity bonus
        views = property.get("views_count", 0)
        score += min(views / 1000, 0.3)
        total += 0.3

        return score / total if total > 0 else 0.5

    async def get_recommendations(
        self,
        user_id: str,
        preferences: dict,
        city: Optional[str] = None,
        limit: int = 10,
    ) -> list[dict]:
        conn = await self._get_connection()
        try:
            interactions = await self._fetch_user_interactions(conn, city)
            properties = await self._fetch_active_properties(conn, city, 200)

            if not properties:
                return []

            prop_map = {p["id"]: p for p in properties}

            # Collaborative filtering
            cf_scores: dict[str, float] = {}
            if interactions:
                user_idx, prop_idx, matrix = self._build_interaction_matrix(interactions, user_id)
                cf_results = self._collaborative_score(user_id, user_idx, prop_idx, matrix, n=50)
                cf_scores = dict(cf_results)

            # Blend CF + content scores
            final_scores: list[tuple[str, float]] = []
            for prop in properties:
                pid = prop["id"]
                cf = cf_scores.get(pid, 0)
                cb = self._content_score(prop, preferences)
                # 60% collaborative, 40% content-based
                blended = 0.6 * cf + 0.4 * cb
                final_scores.append((pid, blended))

            final_scores.sort(key=lambda x: x[1], reverse=True)
            top_ids = [pid for pid, _ in final_scores[:limit]]

            return [prop_map[pid] for pid in top_ids if pid in prop_map]
        finally:
            await conn.close()
