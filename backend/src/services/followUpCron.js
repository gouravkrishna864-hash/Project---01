/**
 * Follow-Up Reminder Cron
 * Runs every 15 minutes. Sends reminders for leads whose follow_up_date has passed.
 *
 * Register in app.js:
 *   require('./services/followUpCron').startFollowUpCron();
 */
const { Op } = require('sequelize');
const Lead = require('../models/Lead');
const User = require('../models/User');
const { notificationService } = require('./notificationService');
const logger = require('../config/logger');

let cronHandle = null;

async function runFollowUpCheck() {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 15 * 60 * 1000); // +15 min

    const dueLeads = await Lead.findAll({
      where: {
        follow_up_date: { [Op.between]: [now, windowEnd] },
        status: { [Op.notIn]: ['deal_closed', 'lost'] },
      },
      include: [
        { model: User, as: 'broker', attributes: ['id', 'name', 'phone'] },
        { model: User, as: 'buyer', attributes: ['id', 'name', 'phone'] },
        { model: require('../models/Property'), as: 'property', attributes: ['id', 'title'] },
      ],
      limit: 100,
    });

    for (const lead of dueLeads) {
      if (lead.broker) {
        await notificationService.notifyFollowUpReminder(lead, lead.broker);
      }
    }

    if (dueLeads.length > 0) {
      logger.info(`Follow-up cron: notified ${dueLeads.length} brokers`);
    }
  } catch (err) {
    logger.error('Follow-up cron error:', err);
  }
}

function startFollowUpCron() {
  if (cronHandle) return;
  cronHandle = setInterval(runFollowUpCheck, 15 * 60 * 1000);
  logger.info('Follow-up reminder cron started (every 15 min)');
  // Run once immediately on startup
  runFollowUpCheck();
}

function stopFollowUpCron() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}

module.exports = { startFollowUpCron, stopFollowUpCron };
