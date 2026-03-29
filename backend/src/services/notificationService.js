/**
 * REOS Notification Service
 *
 * Handles multi-channel notifications:
 *   - In-app (via Redis pub/sub → WebSocket in future)
 *   - SMS (via Twilio / MSG91)
 *   - WhatsApp (via WhatsApp Business API)
 *   - Email (via SendGrid / SES) [stub]
 *
 * Usage:
 *   await notificationService.notifyNewLead(lead, property, broker);
 *   await notificationService.notifyFollowUpReminder(lead, broker);
 */
const { redis } = require('../config/redis');
const logger = require('../config/logger');
const axios = require('axios');

const SMS_PROVIDER = process.env.SMS_PROVIDER || 'msg91'; // msg91 | twilio
const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const TWILIO_SID = process.env.TWILIO_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_FROM || '';
const WA_API_URL = process.env.WHATSAPP_API_URL || '';
const WA_API_KEY = process.env.WHATSAPP_API_KEY || '';

// ─── In-app notification queue ────────────────────────────────────────────────
async function pushInApp(userId, notification) {
  const key = `notifications:${userId}`;
  const payload = JSON.stringify({
    id: Date.now().toString(),
    ...notification,
    read: false,
    created_at: new Date().toISOString(),
  });
  await redis.lpush(key, payload);
  await redis.ltrim(key, 0, 99);   // Keep last 100 notifications
  await redis.expire(key, 86400 * 30); // 30 days TTL
}

async function getInAppNotifications(userId, limit = 20) {
  const key = `notifications:${userId}`;
  const items = await redis.lrange(key, 0, limit - 1);
  return items.map((i) => JSON.parse(i));
}

async function markAllRead(userId) {
  const key = `notifications:${userId}`;
  const items = await redis.lrange(key, 0, -1);
  const updated = items.map((i) => JSON.stringify({ ...JSON.parse(i), read: true }));
  if (updated.length) {
    await redis.del(key);
    await redis.rpush(key, ...updated);
  }
}

// ─── SMS ──────────────────────────────────────────────────────────────────────
async function sendSMS(phone, message) {
  if (!phone) return;
  const e164 = phone.startsWith('+') ? phone : `+91${phone}`;

  try {
    if (SMS_PROVIDER === 'msg91' && MSG91_AUTH_KEY) {
      await axios.post('https://api.msg91.com/api/v5/flow/', {
        authkey: MSG91_AUTH_KEY,
        mobiles: e164,
        message,
        route: '4',
        sender: 'REOS',
      });
    } else if (SMS_PROVIDER === 'twilio' && TWILIO_SID) {
      const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
      await axios.post(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
        new URLSearchParams({ To: e164, From: TWILIO_FROM, Body: message }),
        { headers: { Authorization: `Basic ${auth}` } }
      );
    } else {
      logger.debug(`[SMS stub] → ${e164}: ${message}`);
    }
  } catch (err) {
    logger.error(`SMS failed to ${e164}:`, err.message);
  }
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
async function sendWhatsApp(phone, templateName, variables = []) {
  if (!phone || !WA_API_URL) {
    logger.debug(`[WA stub] → ${phone}: ${templateName} ${JSON.stringify(variables)}`);
    return;
  }

  const e164 = phone.startsWith('+') ? phone : `+91${phone}`;
  try {
    await axios.post(`${WA_API_URL}/messages`, {
      to: e164,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'en' },
        components: variables.length ? [{
          type: 'body',
          parameters: variables.map((v) => ({ type: 'text', text: String(v) })),
        }] : [],
      },
    }, {
      headers: { Authorization: `Bearer ${WA_API_KEY}` },
    });
  } catch (err) {
    logger.error(`WhatsApp failed to ${e164}:`, err.message);
  }
}

// ─── Notification Templates ───────────────────────────────────────────────────

/**
 * Triggered when a buyer expresses interest in a broker's property.
 */
async function notifyNewLead(lead, property, broker) {
  const buyerName = lead.buyer?.name || 'A buyer';
  const propTitle = property.title || 'your property';
  const score = Math.round(lead.ai_score);
  const priority = lead.priority.toUpperCase();

  const smsMsg = `[REOS] New ${priority} lead! ${buyerName} is interested in "${propTitle}" (AI Score: ${score}/100). Check your CRM: reos.in/broker/crm`;
  const waTemplate = 'broker_new_lead';
  const waVars = [broker.name?.split(' ')[0], buyerName, propTitle, String(score), priority];

  await Promise.all([
    pushInApp(broker.id, {
      type: 'new_lead',
      title: `New ${priority} Lead!`,
      body: `${buyerName} is interested in ${propTitle}. AI Score: ${score}`,
      link: `/broker/crm`,
      meta: { lead_id: lead.id, score },
    }),
    sendSMS(broker.phone, smsMsg),
    sendWhatsApp(broker.phone, waTemplate, waVars),
  ]);

  logger.info(`Lead notification sent to broker ${broker.id} for lead ${lead.id}`);
}

/**
 * Follow-up reminder — sent at the scheduled time.
 */
async function notifyFollowUpReminder(lead, broker) {
  const buyerName = lead.buyer?.name || 'your lead';
  const propTitle = lead.property?.title || 'a property';

  const smsMsg = `[REOS] Follow-up reminder: Contact ${buyerName} about "${propTitle}". Open CRM: reos.in/broker/crm`;

  await Promise.all([
    pushInApp(broker.id, {
      type: 'follow_up',
      title: 'Follow-up Reminder',
      body: `Time to contact ${buyerName} about ${propTitle}`,
      link: `/broker/crm`,
    }),
    sendSMS(broker.phone, smsMsg),
  ]);
}

/**
 * Notify buyer when broker responds / visit is scheduled.
 */
async function notifyBuyerVisitScheduled(lead, visitDate, buyer, property) {
  const dateStr = new Date(visitDate).toLocaleDateString('en-IN', {
    weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const smsMsg = `[REOS] Site visit confirmed for "${property.title}" on ${dateStr}. Address: ${property.address}. Questions? reos.in/dashboard`;

  await Promise.all([
    pushInApp(buyer.id, {
      type: 'visit_scheduled',
      title: 'Site Visit Confirmed!',
      body: `Your visit to ${property.title} is scheduled for ${dateStr}`,
      link: `/dashboard`,
    }),
    sendSMS(buyer.phone, smsMsg),
  ]);
}

/**
 * Notify buyer when offer is accepted.
 */
async function notifyOfferAccepted(transaction, buyer, property) {
  const smsMsg = `[REOS] 🎉 Your offer for "${property.title}" has been ACCEPTED! Final price: ₹${transaction.final_price?.toLocaleString('en-IN')}. Next step: Agreement signing.`;

  await Promise.all([
    pushInApp(buyer.id, {
      type: 'offer_accepted',
      title: 'Offer Accepted! 🎉',
      body: `Your offer for ${property.title} has been accepted.`,
      link: `/dashboard`,
    }),
    sendSMS(buyer.phone, smsMsg),
  ]);
}

module.exports = {
  notificationService: {
    pushInApp,
    getInAppNotifications,
    markAllRead,
    sendSMS,
    sendWhatsApp,
    notifyNewLead,
    notifyFollowUpReminder,
    notifyBuyerVisitScheduled,
    notifyOfferAccepted,
  },
};
