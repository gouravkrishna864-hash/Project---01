/**
 * Transaction Engine
 * Manages deal lifecycle, site visit scheduling, offer flows.
 */
const Transaction = require('../models/Transaction');
const Lead = require('../models/Lead');

const VALID_STATUS_TRANSITIONS = {
  offer_made: ['counter_offer', 'accepted', 'cancelled'],
  counter_offer: ['offer_made', 'accepted', 'cancelled'],
  accepted: ['agreement_signed', 'cancelled'],
  agreement_signed: ['loan_applied', 'registration_done'],
  loan_applied: ['agreement_signed', 'registration_done'],
  registration_done: ['completed'],
  completed: [],
  cancelled: [],
};

function isValidTransition(from, to) {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

async function advanceStatus(transactionId, newStatus, actorId, note = '') {
  const transaction = await Transaction.findByPk(transactionId);
  if (!transaction) throw new Error('Transaction not found');

  if (!isValidTransition(transaction.status, newStatus)) {
    throw new Error(`Invalid transition: ${transaction.status} → ${newStatus}`);
  }

  const timelineEntry = { status: newStatus, timestamp: new Date(), actor: actorId, note };
  const updates = {
    status: newStatus,
    timeline: [...transaction.timeline, timelineEntry],
  };

  if (newStatus === 'completed') {
    updates.completed_at = new Date();
    updates.reos_fee = Math.round(transaction.final_price * 0.005); // 0.5% platform fee
    updates.broker_commission = Math.round(transaction.final_price * 0.02); // 2%

    // Update associated lead to deal_closed
    await Lead.update(
      { status: 'deal_closed' },
      { where: { property_id: transaction.property_id, user_id: transaction.buyer_id } }
    );
  }

  return transaction.update(updates);
}

async function scheduleSiteVisit(leadId, visitDate, brokerId) {
  const lead = await Lead.findOne({ where: { id: leadId, broker_id: brokerId } });
  if (!lead) throw new Error('Lead not found or not authorized');

  return lead.update({
    status: 'site_visit_scheduled',
    visit_scheduled_at: visitDate,
    last_contacted_at: new Date(),
  });
}

async function getActiveDealsPipeline(brokerId) {
  const transactions = await Transaction.findAll({
    where: { broker_id: brokerId },
    attributes: ['id', 'status', 'offer_price', 'final_price', 'created_at', 'property_id'],
    order: [['created_at', 'DESC']],
  });

  const pipeline = {
    offer_made: [],
    negotiating: [],
    agreement: [],
    closing: [],
    completed: [],
    cancelled: [],
  };

  for (const t of transactions) {
    if (['offer_made', 'counter_offer'].includes(t.status)) pipeline.offer_made.push(t);
    else if (t.status === 'accepted') pipeline.negotiating.push(t);
    else if (['agreement_signed', 'loan_applied'].includes(t.status)) pipeline.agreement.push(t);
    else if (t.status === 'registration_done') pipeline.closing.push(t);
    else if (t.status === 'completed') pipeline.completed.push(t);
    else pipeline.cancelled.push(t);
  }

  return pipeline;
}

module.exports = { transactionEngine: { advanceStatus, scheduleSiteVisit, getActiveDealsPipeline, isValidTransition } };
