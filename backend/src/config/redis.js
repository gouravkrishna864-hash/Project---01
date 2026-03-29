const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  lazyConnect: true,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error('Redis error:', err));

const CACHE_TTL = {
  PROPERTY: 300,       // 5 minutes
  SEARCH: 60,          // 1 minute
  USER_PROFILE: 600,   // 10 minutes
  PRICE_TREND: 3600,   // 1 hour
};

async function getCache(key) {
  const data = await redis.get(key);
  return data ? JSON.parse(data) : null;
}

async function setCache(key, value, ttl = CACHE_TTL.PROPERTY) {
  await redis.setex(key, ttl, JSON.stringify(value));
}

async function delCache(key) {
  await redis.del(key);
}

async function delCacheByPattern(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
}

module.exports = { redis, getCache, setCache, delCache, delCacheByPattern, CACHE_TTL };
