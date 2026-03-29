const { Op } = require('sequelize');
const Lead = require('../../models/Lead');
const Property = require('../../models/Property');
const User = require('../../models/User');
const { runQuery } = require('../../config/neo4j');
const axios = require('axios');
const logger = require('../../config/logger');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';

async function createLead(req, res) {
  const { property_id, budget, source } = req.body;

  try {
    const property = await Property.findByPk(property_id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    const existing = await Lead.findOne({
      where: { user_id: req.user.id, property_id, status: { [Op.notIn]: ['deal_closed', 'lost'] } },
    });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Lead already exists', data: existing });
    }

    // Get AI lead score
    let ai_score = 50;
    let score_factors = {};
    let priority = 'warm';
    try {
      const aiRes = await axios.post(`${AI_ENGINE_URL}/lead-score`, {
        user_id: req.user.id,
        property_id,
        budget,
        user_preferences: req.user.preferences,
      }, { timeout: 3000 });
      ai_score = aiRes.data.score;
      score_factors = aiRes.data.factors;
      priority = ai_score >= 75 ? 'hot' : ai_score >= 45 ? 'warm' : 'cold';
    } catch { /* non-fatal */ }

    const lead = await Lead.create({
      user_id: req.user.id,
      property_id,
      broker_id: property.broker_id,
      budget,
      source: source || 'search',
      ai_score,
      score_factors,
      priority,
    });

    await property.increment('leads_count');

    // Record interest in Neo4j
    await runQuery(
      `MATCH (u:User {id: $uid}), (p:Property {id: $pid})
       MERGE (u)-[r:INTERESTED]->(p)
       SET r.score = $score, r.created_at = datetime()`,
      { uid: req.user.id, pid: property_id, score: ai_score }
    ).catch(() => {});

    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    logger.error('Create lead error:', err);
    res.status(500).json({ success: false, message: 'Failed to create lead' });
  }
}

async function getBrokerLeads(req, res) {
  const { status, priority, page = 1, limit = 20 } = req.query;
  const where = { broker_id: req.user.id };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const { count, rows } = await Lead.findAndCountAll({
    where,
    include: [
      { model: User, as: 'buyer', attributes: ['id', 'name', 'phone', 'email'] },
      { model: Property, as: 'property', attributes: ['id', 'title', 'locality', 'city', 'price', 'images'] },
    ],
    order: [['ai_score', 'DESC'], ['created_at', 'DESC']],
    limit: Number(limit),
    offset: (Number(page) - 1) * Number(limit),
  });

  res.json({
    success: true,
    data: rows,
    pagination: { total: count, page: Number(page), pages: Math.ceil(count / limit) },
  });
}

async function updateLeadStatus(req, res) {
  const { id } = req.params;
  const { status, notes, follow_up_date, visit_scheduled_at } = req.body;

  const lead = await Lead.findOne({ where: { id, broker_id: req.user.id } });
  if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

  await lead.update({
    status,
    notes,
    follow_up_date,
    visit_scheduled_at,
    last_contacted_at: ['contacted', 'site_visit_scheduled'].includes(status) ? new Date() : lead.last_contacted_at,
  });

  res.json({ success: true, data: lead });
}

async function getLeadStats(req, res) {
  const { sequelize } = require('../../config/database');
  const stats = await Lead.findAll({
    where: { broker_id: req.user.id },
    attributes: [
      'status',
      'priority',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('AVG', sequelize.col('ai_score')), 'avg_score'],
    ],
    group: ['status', 'priority'],
    raw: true,
  });

  res.json({ success: true, data: stats });
}

module.exports = { createLead, getBrokerLeads, updateLeadStatus, getLeadStats };
