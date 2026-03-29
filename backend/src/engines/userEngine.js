/**
 * User Engine
 * Handles behavior tracking, preference updates, and activity analysis.
 */
const { runQuery } = require('../config/neo4j');
const { setCache, getCache, CACHE_TTL } = require('../config/redis');

/**
 * Track a user behavior event (view, search, shortlist).
 */
async function trackBehavior(userId, event, metadata = {}) {
  const key = `behavior:${userId}:${Date.now()}`;
  await setCache(key, { userId, event, metadata, ts: new Date() }, 86400);

  if (event === 'view' && metadata.propertyId) {
    await runQuery(
      `MATCH (u:User {id: $uid}), (p:Property {id: $pid})
       MERGE (u)-[r:VIEWED]->(p)
       SET r.count = coalesce(r.count, 0) + 1, r.last_viewed = datetime()`,
      { uid: userId, pid: metadata.propertyId }
    ).catch(() => {});
  }

  if (event === 'shortlist' && metadata.propertyId) {
    await runQuery(
      `MATCH (u:User {id: $uid}), (p:Property {id: $pid})
       MERGE (u)-[:SHORTLISTED]->(p)`,
      { uid: userId, pid: metadata.propertyId }
    ).catch(() => {});
  }
}

/**
 * Build a user preference profile from their behavior history.
 */
async function buildPreferenceProfile(userId) {
  const records = await runQuery(
    `MATCH (u:User {id: $uid})-[r:VIEWED|INTERESTED]->(p:Property)
     WITH p.city AS city, p.type AS type, p.bedrooms AS bhk,
          p.price AS price, COUNT(r) AS interactions
     ORDER BY interactions DESC
     RETURN city, type, bhk, AVG(price) AS avg_budget, SUM(interactions) AS total
     LIMIT 10`,
    { uid: userId }
  );

  const profile = {
    preferred_cities: [],
    preferred_types: [],
    preferred_bhk: [],
    estimated_budget_min: null,
    estimated_budget_max: null,
  };

  const prices = [];
  for (const r of records) {
    const city = r.get('city');
    const type = r.get('type');
    const bhk = r.get('bhk');
    const avgBudget = r.get('avg_budget');

    if (city && !profile.preferred_cities.includes(city)) profile.preferred_cities.push(city);
    if (type && !profile.preferred_types.includes(type)) profile.preferred_types.push(type);
    if (bhk && !profile.preferred_bhk.includes(bhk)) profile.preferred_bhk.push(bhk);
    if (avgBudget) prices.push(avgBudget);
  }

  if (prices.length) {
    profile.estimated_budget_min = Math.min(...prices) * 0.8;
    profile.estimated_budget_max = Math.max(...prices) * 1.2;
  }

  return profile;
}

/**
 * Get broker performance stats: response rate, deal closure rate.
 */
async function getBrokerStats(brokerId) {
  const cacheKey = `broker_stats:${brokerId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const records = await runQuery(
    `MATCH (:User {id: $bid})-[:LISTED]->(p:Property)
     OPTIONAL MATCH (p)<-[:INTERESTED]-(u:User)
     RETURN COUNT(DISTINCT p) AS listings, COUNT(DISTINCT u) AS total_leads`,
    { bid: brokerId }
  );

  const stats = records.length > 0 ? {
    listings: records[0].get('listings').toNumber(),
    total_leads: records[0].get('total_leads').toNumber(),
  } : { listings: 0, total_leads: 0 };

  await setCache(cacheKey, stats, CACHE_TTL.USER_PROFILE);
  return stats;
}

module.exports = { userEngine: { trackBehavior, buildPreferenceProfile, getBrokerStats } };
