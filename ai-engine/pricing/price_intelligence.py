"""
REOS Price Intelligence Engine
  - get_trend: historical price trend for a city/locality/type
  - estimate_fair_value: ML-based fair price estimation
  - detect_overpriced: flag listings priced above fair value
"""
import os
from typing import Optional
import asyncpg
import numpy as np


class PriceIntelligenceEngine:
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")

    async def _get_connection(self):
        return await asyncpg.connect(self.db_url)

    async def get_trend(
        self,
        city: str,
        locality: Optional[str] = None,
        prop_type: str = "apartment",
        bedrooms: int = 2,
    ) -> dict:
        """Return monthly average price per sqft trend for past 12 months."""
        conn = await self._get_connection()
        try:
            query = """
                SELECT
                    DATE_TRUNC('month', created_at) AS month,
                    AVG(price_per_sqft) AS avg_psf,
                    AVG(price) AS avg_price,
                    COUNT(*) AS listing_count
                FROM properties
                WHERE city ILIKE $1
                  AND type = $2
                  AND bedrooms = $3
                  AND status IN ('active', 'sold')
                  AND created_at >= NOW() - INTERVAL '12 months'
                  AND price_per_sqft IS NOT NULL
                  {locality_filter}
                GROUP BY month
                ORDER BY month
            """
            locality_filter = "AND locality ILIKE $4" if locality else ""
            args = [f"%{city}%", prop_type, bedrooms]
            if locality:
                args.append(f"%{locality}%")

            rows = await conn.fetch(query.format(locality_filter=locality_filter), *args)
            trend_data = [
                {
                    "month": r["month"].strftime("%Y-%m"),
                    "avg_price_per_sqft": round(float(r["avg_psf"] or 0), 0),
                    "avg_price": round(float(r["avg_price"] or 0), 0),
                    "listing_count": r["listing_count"],
                }
                for r in rows
            ]

            # Compute growth rate (last 3 months vs 3 months before)
            growth_rate = None
            if len(trend_data) >= 6:
                recent_avg = np.mean([d["avg_price_per_sqft"] for d in trend_data[-3:]])
                older_avg = np.mean([d["avg_price_per_sqft"] for d in trend_data[-6:-3]])
                if older_avg > 0:
                    growth_rate = round(((recent_avg - older_avg) / older_avg) * 100, 2)

            return {
                "city": city,
                "locality": locality,
                "type": prop_type,
                "bedrooms": bedrooms,
                "trend": trend_data,
                "growth_rate_3m": growth_rate,
                "current_avg_psf": trend_data[-1]["avg_price_per_sqft"] if trend_data else None,
            }
        finally:
            await conn.close()

    async def estimate_fair_value(self, property_data: dict) -> dict:
        """
        Estimate fair market value using comparable properties.
        Uses median price per sqft of comparable listings in the same locality.
        """
        conn = await self._get_connection()
        try:
            city = property_data.get("city")
            locality = property_data.get("locality")
            prop_type = property_data.get("type", "apartment")
            bedrooms = property_data.get("bedrooms")
            area_sqft = property_data.get("area_sqft")
            listed_price = property_data.get("price")

            # Fetch comparable properties
            rows = await conn.fetch(
                """
                SELECT price, price_per_sqft, area_sqft
                FROM properties
                WHERE city ILIKE $1
                  AND type = $2
                  AND bedrooms = $3
                  AND status IN ('active', 'sold')
                  AND price_per_sqft IS NOT NULL
                  AND locality ILIKE $4
                LIMIT 50
                """,
                f"%{city}%", prop_type, bedrooms, f"%{locality}%",
            )

            if not rows:
                # Fallback: city-level comparables
                rows = await conn.fetch(
                    """
                    SELECT price, price_per_sqft, area_sqft
                    FROM properties
                    WHERE city ILIKE $1
                      AND type = $2
                      AND bedrooms = $3
                      AND status IN ('active', 'sold')
                      AND price_per_sqft IS NOT NULL
                    LIMIT 100
                    """,
                    f"%{city}%", prop_type, bedrooms,
                )

            if not rows or not area_sqft:
                return {"fair_value": None, "confidence": "low", "comparables": 0}

            psf_values = [float(r["price_per_sqft"]) for r in rows]
            median_psf = float(np.median(psf_values))
            p25 = float(np.percentile(psf_values, 25))
            p75 = float(np.percentile(psf_values, 75))

            fair_value = round(median_psf * float(area_sqft))
            fair_range = (round(p25 * float(area_sqft)), round(p75 * float(area_sqft)))

            is_overpriced = None
            overpriced_pct = None
            if listed_price:
                overpriced_pct = round(((listed_price - fair_value) / fair_value) * 100, 1)
                is_overpriced = overpriced_pct > 15

            confidence = "high" if len(rows) >= 20 else "medium" if len(rows) >= 5 else "low"

            return {
                "fair_value": fair_value,
                "fair_range": {"min": fair_range[0], "max": fair_range[1]},
                "median_price_per_sqft": round(median_psf),
                "comparables": len(rows),
                "confidence": confidence,
                "is_overpriced": is_overpriced,
                "overpriced_pct": overpriced_pct,
            }
        finally:
            await conn.close()
