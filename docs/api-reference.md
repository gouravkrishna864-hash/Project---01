# REOS API Reference

Base URL: `http://localhost:5000/api`

## Authentication

### Register
`POST /auth/register`
```json
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone": "9876543210",
  "password": "SecurePass@123",
  "role": "buyer",
  "city": "Pune"
}
```

### Login
`POST /auth/login`
```json
{ "email": "rahul@example.com", "password": "SecurePass@123" }
```
Returns: `{ accessToken, refreshToken, user }`

---

## Properties

### List Properties
`GET /properties`

Query params:
| Param | Type | Description |
|-------|------|-------------|
| `city` | string | Filter by city |
| `locality` | string | Filter by locality |
| `type` | enum | apartment, villa, plot, commercial, pg, house |
| `listing_type` | enum | sale, rent |
| `min_price` | number | Min price in INR |
| `max_price` | number | Max price in INR |
| `bedrooms` | number | BHK count |
| `is_verified` | boolean | Verified listings only |
| `page` | number | Page number (default 1) |
| `sort` | string | Sort field (default: created_at) |

### Get Property
`GET /properties/:id`

### Get Recommendations (Auth required)
`GET /properties/recommendations`

### Get Price Trend
`GET /properties/price-trend?city=Pune&type=apartment&bedrooms=2`

### Create Property (broker/builder only)
`POST /properties`
```json
{
  "title": "2BHK Premium Flat in Baner",
  "type": "apartment",
  "listing_type": "sale",
  "price": 6500000,
  "area_sqft": 950,
  "bedrooms": 2,
  "bathrooms": 2,
  "address": "Sunrise Residency",
  "locality": "Baner",
  "city": "Pune",
  "state": "Maharashtra"
}
```

---

## Leads

### Express Interest
`POST /leads`
```json
{ "property_id": "uuid", "budget": 7000000, "source": "search" }
```

### Get Broker Leads (broker only)
`GET /leads/broker?status=new&priority=hot`

### Update Lead Status (broker only)
`PATCH /leads/:id/status`
```json
{ "status": "site_visit_scheduled", "visit_scheduled_at": "2024-07-15T10:00:00Z" }
```

---

## Transactions

### Make an Offer
`POST /transactions/offer`
```json
{ "property_id": "uuid", "offer_price": 6200000, "notes": "Ready for immediate registration" }
```

### Get My Transactions
`GET /transactions/my`

---

## AI Engine

Base URL: `http://localhost:8000`

### Smart Search Parse
`POST /search/parse`
```json
{ "query": "2BHK under 50L near metro in Pune" }
```
Returns:
```json
{
  "bedrooms": 2,
  "max_price": 5000000,
  "city": "Pune",
  "amenities": ["metro"],
  "listing_type": "sale",
  "confidence": "high"
}
```

### Lead Score
`POST /lead-score`
```json
{ "user_id": "uuid", "property_id": "uuid", "budget": 7000000, "user_preferences": {} }
```
Returns: `{ score: 82.5, priority: "hot", factors: { budget: {...}, location: {...} } }`

### Price Trend
`GET /price-trend?city=Pune&type=apartment&bedrooms=2`

### Price Estimate
`POST /price-estimate`
```json
{ "city": "Pune", "locality": "Baner", "type": "apartment", "bedrooms": 2, "area_sqft": 950, "price": 6800000 }
```
Returns: `{ fair_value: 6500000, fair_range: {min: 5800000, max: 7200000}, is_overpriced: true, overpriced_pct: 4.6 }`
