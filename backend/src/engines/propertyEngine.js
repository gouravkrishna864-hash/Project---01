/**
 * Property Engine
 * Core business logic for property operations:
 * geo-tagging, price history tracking, status management
 */
const { runQuery } = require('../config/neo4j');

async function syncPropertyToGraph(property) {
  await runQuery(
    `MERGE (p:Property {id: $id})
     SET p.title = $title,
         p.city = $city,
         p.locality = $locality,
         p.price = $price,
         p.type = $type,
         p.bedrooms = $bedrooms,
         p.lat = $lat,
         p.lng = $lng`,
    {
      id: property.id,
      title: property.title,
      city: property.city,
      locality: property.locality,
      price: property.price,
      type: property.type,
      bedrooms: property.bedrooms || 0,
      lat: property.latitude || 0,
      lng: property.longitude || 0,
    }
  );
}

/**
 * Find similar properties using graph relationships.
 * Properties are similar if multiple buyers have viewed both.
 */
async function findSimilarProperties(propertyId, limit = 5) {
  const records = await runQuery(
    `MATCH (p:Property {id: $pid})<-[:VIEWED]-(u:User)-[:VIEWED]->(similar:Property)
     WHERE similar.id <> $pid
     WITH similar, COUNT(u) AS shared_viewers
     ORDER BY shared_viewers DESC
     RETURN similar.id AS id, shared_viewers
     LIMIT $limit`,
    { pid: propertyId, limit }
  );
  return records.map((r) => ({ id: r.get('id'), shared_viewers: r.get('shared_viewers').toNumber() }));
}

/**
 * Get trending properties in a city based on recent views.
 */
async function getTrendingProperties(city, limit = 10) {
  const records = await runQuery(
    `MATCH (u:User)-[v:VIEWED]->(p:Property {city: $city})
     WHERE v.last_viewed > datetime() - duration('P7D')
     WITH p, COUNT(v) AS weekly_views
     ORDER BY weekly_views DESC
     RETURN p.id AS id, weekly_views
     LIMIT $limit`,
    { city, limit }
  );
  return records.map((r) => ({ id: r.get('id'), weekly_views: r.get('weekly_views').toNumber() }));
}

/**
 * Compute price per sqft and update property.
 */
function computePricePerSqft(price, areaSqft) {
  if (!price || !areaSqft) return null;
  return Math.round(price / areaSqft);
}

module.exports = { propertyEngine: { syncPropertyToGraph, findSimilarProperties, getTrendingProperties, computePricePerSqft } };
