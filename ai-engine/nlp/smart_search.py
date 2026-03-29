"""
REOS Smart Search Parser (NLP)
Converts natural language queries into structured search parameters.

Examples:
  "2BHK under 50L near metro in Pune"
  → {bedrooms: 2, max_price: 5000000, amenities: ["metro"], city: "Pune"}

  "3bhk flat for rent in Banjara Hills below 40k"
  → {bedrooms: 3, type: "apartment", listing_type: "rent", locality: "Banjara Hills", max_price: 40000}

Uses regex + keyword matching (no external API required).
Optionally uses OpenAI GPT for complex queries if OPENAI_API_KEY is set.
"""
import re
import os
from typing import Optional


BHK_PATTERN = re.compile(r'(\d)\s*(?:bhk|bedroom|bed|br)', re.IGNORECASE)
PRICE_PATTERN = re.compile(
    r'(?:under|below|less than|upto|up to|max|within)?\s*'
    r'(\d+(?:\.\d+)?)\s*'
    r'(cr|crore|l|lac|lakh|k|thousand)',
    re.IGNORECASE,
)
RENT_KEYWORDS = re.compile(r'\b(rent|rental|lease|pg|paying guest)\b', re.IGNORECASE)
SALE_KEYWORDS = re.compile(r'\b(buy|sale|purchase|resale|new)\b', re.IGNORECASE)

PROPERTY_TYPE_MAP = {
    'flat': 'apartment', 'apartment': 'apartment', 'appt': 'apartment',
    'villa': 'villa', 'bungalow': 'villa', 'independent house': 'house',
    'house': 'house', 'plot': 'plot', 'land': 'plot',
    'commercial': 'commercial', 'office': 'commercial', 'shop': 'commercial',
    'pg': 'pg',
}

AMENITY_KEYWORDS = ['metro', 'school', 'hospital', 'mall', 'park', 'gym', 'pool', 'parking']

KNOWN_CITIES = [
    'mumbai', 'pune', 'delhi', 'bangalore', 'bengaluru', 'hyderabad',
    'chennai', 'kolkata', 'ahmedabad', 'jaipur', 'lucknow', 'noida',
    'gurgaon', 'gurugram', 'chandigarh', 'kochi', 'indore', 'bhopal',
    'nagpur', 'surat', 'vadodara',
]


def _normalize_price(value: float, unit: str) -> int:
    unit = unit.lower()
    if unit in ('cr', 'crore'):
        return int(value * 10_000_000)
    elif unit in ('l', 'lac', 'lakh'):
        return int(value * 100_000)
    elif unit in ('k', 'thousand'):
        return int(value * 1_000)
    return int(value)


class SmartSearchParser:
    def parse(self, query: str) -> dict:
        result: dict = {}

        # BHK
        bhk_match = BHK_PATTERN.search(query)
        if bhk_match:
            result['bedrooms'] = int(bhk_match.group(1))

        # Price
        price_match = PRICE_PATTERN.search(query)
        if price_match:
            value = float(price_match.group(1))
            unit = price_match.group(2)
            result['max_price'] = _normalize_price(value, unit)

        # Listing type
        if RENT_KEYWORDS.search(query):
            result['listing_type'] = 'rent'
        elif SALE_KEYWORDS.search(query):
            result['listing_type'] = 'sale'

        # Property type
        q_lower = query.lower()
        for keyword, ptype in PROPERTY_TYPE_MAP.items():
            if keyword in q_lower:
                result['type'] = ptype
                break

        # City
        for city in KNOWN_CITIES:
            if city in q_lower:
                result['city'] = city.capitalize()
                break

        # Locality (text after "in" or "near" that isn't a known city)
        locality_match = re.search(r'\b(?:in|near|at)\s+([A-Za-z\s]{3,30}?)(?:\s+(?:below|under|above|for|with|$))', query, re.IGNORECASE)
        if locality_match:
            candidate = locality_match.group(1).strip()
            if candidate.lower() not in KNOWN_CITIES:
                result['locality'] = candidate.title()

        # Amenities
        found_amenities = [a for a in AMENITY_KEYWORDS if a in q_lower]
        if found_amenities:
            result['amenities'] = found_amenities

        # Furnishing
        if 'fully furnished' in q_lower or 'fully-furnished' in q_lower:
            result['furnishing'] = 'fully-furnished'
        elif 'semi furnished' in q_lower or 'semi-furnished' in q_lower:
            result['furnishing'] = 'semi-furnished'
        elif 'unfurnished' in q_lower:
            result['furnishing'] = 'unfurnished'

        result['original_query'] = query
        result['confidence'] = self._confidence(result)
        return result

    def _confidence(self, parsed: dict) -> str:
        score = 0
        if 'city' in parsed: score += 2
        if 'max_price' in parsed: score += 2
        if 'bedrooms' in parsed: score += 2
        if 'listing_type' in parsed: score += 1
        if 'type' in parsed: score += 1
        if 'locality' in parsed: score += 1
        if score >= 6: return 'high'
        if score >= 3: return 'medium'
        return 'low'
