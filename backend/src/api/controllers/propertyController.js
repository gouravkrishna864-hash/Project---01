const { Op } = require('sequelize');
const { validationResult } = require('express-validator');
const Property = require('../../models/Property');
const Lead = require('../../models/Lead');
const { runQuery } = require('../../config/neo4j');
const { getCache, setCache, delCacheByPattern, CACHE_TTL } = require('../../config/redis');
const { propertyEngine } = require('../../engines/propertyEngine');
const axios = require('axios');
const logger = require('../../config/logger');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

async function listProperties(req, res) {
  const {
    city, locality, type, listing_type, min_price, max_price,
    bedrooms, furnishing, is_verified, is_featured,
    page = 1, limit = 20, sort = 'created_at', order = 'DESC',
  } = req.query;

  const cacheKey = `properties:list:${JSON.stringify(req.query)}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, ...cached, fromCache: true });

  const where = { status: 'active' };
  if (city) where.city = { [Op.iLike]: `%${city}%` };
  if (locality) where.locality = { [Op.iLike]: `%${locality}%` };
  if (type) where.type = type;
  if (listing_type) where.listing_type = listing_type;
  if (bedrooms) where.bedrooms = Number(bedrooms);
  if (furnishing) where.furnishing = furnishing;
  if (is_verified !== undefined) where.is_verified = is_verified === 'true';
  if (is_featured !== undefined) where.is_featured = is_featured === 'true';
  if (min_price || max_price) {
    where.price = {};
    if (min_price) where.price[Op.gte] = Number(min_price);
    if (max_price) where.price[Op.lte] = Number(max_price);
  }

  const offset = (Number(page) - 1) * Number(limit);
  const { count, rows } = await Property.findAndCountAll({
    where,
    limit: Number(limit),
    offset,
    order: [[sort, order]],
  });

  const result = {
    data: rows,
    pagination: { total: count, page: Number(page), limit: Number(limit), pages: Math.ceil(count / limit) },
  };
  await setCache(cacheKey, result, CACHE_TTL.SEARCH);
  res.json({ success: true, ...result });
}

async function getProperty(req, res) {
  const { id } = req.params;
  const cacheKey = `property:${id}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    // Still increment view count in background
    Property.increment('views_count', { where: { id } }).catch(() => {});
    return res.json({ success: true, data: cached, fromCache: true });
  }

  const property = await Property.findByPk(id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  await property.increment('views_count');

  // Record view in Neo4j graph (async, non-blocking)
  if (req.user) {
    runQuery(
      `MATCH (u:User {id: $uid}), (p:Property {id: $pid})
       MERGE (u)-[r:VIEWED]->(p)
       SET r.last_viewed = datetime(), r.count = coalesce(r.count, 0) + 1`,
      { uid: req.user.id, pid: id }
    ).catch(() => {});
  }

  await setCache(cacheKey, property.toJSON(), CACHE_TTL.PROPERTY);
  res.json({ success: true, data: property });
}

async function createProperty(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const data = {
      ...req.body,
      broker_id: req.user.role === 'builder' ? req.body.broker_id : req.user.id,
      builder_id: req.user.role === 'builder' ? req.user.id : undefined,
      status: 'pending_review',
    };

    const property = await Property.create(data);

    // Add to Neo4j graph
    await runQuery(
      `MATCH (u:User {id: $uid})
       CREATE (p:Property {id: $pid, title: $title, city: $city, price: $price, type: $type})
       CREATE (u)-[:LISTED]->(p)`,
      { uid: req.user.id, pid: property.id, title: property.title, city: property.city, price: property.price, type: property.type }
    ).catch(() => {});

    await delCacheByPattern('properties:list:*');
    logger.info(`Property created: ${property.id} by ${req.user.id}`);
    res.status(201).json({ success: true, data: property });
  } catch (err) {
    logger.error('Create property error:', err);
    res.status(500).json({ success: false, message: 'Failed to create property' });
  }
}

async function updateProperty(req, res) {
  const { id } = req.params;
  const property = await Property.findByPk(id);
  if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

  const isOwner = property.broker_id === req.user.id || property.builder_id === req.user.id;
  if (!isOwner && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  // Track price history
  if (req.body.price && req.body.price !== property.price) {
    const history = [...property.price_history, { price: property.price, date: new Date() }];
    req.body.price_history = history;
  }

  await property.update(req.body);
  await delCacheByPattern(`property:${id}`);
  await delCacheByPattern('properties:list:*');

  res.json({ success: true, data: property });
}

async function getRecommendations(req, res) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Login required' });

  try {
    const response = await axios.post(`${AI_ENGINE_URL}/recommend`, {
      user_id: req.user.id,
      preferences: req.user.preferences,
      city: req.user.city,
      limit: 10,
    }, { timeout: 5000 });

    res.json({ success: true, data: response.data });
  } catch (err) {
    // Fallback to featured properties
    const fallback = await Property.findAll({
      where: { status: 'active', is_featured: true },
      limit: 10,
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: fallback, fallback: true });
  }
}

async function getPriceTrend(req, res) {
  const { city, type, bedrooms } = req.query;
  const cacheKey = `price_trend:${city}:${type}:${bedrooms}`;
  const cached = await getCache(cacheKey);
  if (cached) return res.json({ success: true, data: cached });

  try {
    const response = await axios.get(`${AI_ENGINE_URL}/price-trend`, {
      params: { city, type, bedrooms },
      timeout: 5000,
    });
    await setCache(cacheKey, response.data, CACHE_TTL.PRICE_TREND);
    res.json({ success: true, data: response.data });
  } catch (err) {
    res.status(502).json({ success: false, message: 'Price intelligence unavailable' });
  }
}

module.exports = { listProperties, getProperty, createProperty, updateProperty, getRecommendations, getPriceTrend };
