const Transaction = require('../../models/Transaction');
const Property = require('../../models/Property');
const User = require('../../models/User');
const logger = require('../../config/logger');

async function makeOffer(req, res) {
  const { property_id, offer_price, notes } = req.body;

  try {
    const property = await Property.findByPk(property_id);
    if (!property || property.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Property not available' });
    }

    const transaction = await Transaction.create({
      property_id,
      buyer_id: req.user.id,
      broker_id: property.broker_id,
      offer_price,
      notes,
      timeline: [{ status: 'offer_made', timestamp: new Date(), note: `Offer of ₹${offer_price.toLocaleString('en-IN')} made` }],
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    logger.error('Make offer error:', err);
    res.status(500).json({ success: false, message: 'Failed to make offer' });
  }
}

async function updateTransaction(req, res) {
  const { id } = req.params;
  const { status, final_price, notes, loan_details } = req.body;

  const transaction = await Transaction.findByPk(id, {
    include: [{ model: Property, as: 'property' }],
  });
  if (!transaction) return res.status(404).json({ success: false, message: 'Transaction not found' });

  const isParty = [transaction.buyer_id, transaction.broker_id].includes(req.user.id) || req.user.role === 'admin';
  if (!isParty) return res.status(403).json({ success: false, message: 'Not authorized' });

  const timeline = [
    ...transaction.timeline,
    { status, timestamp: new Date(), note: notes || `Status updated to ${status}` },
  ];

  const updates = { status, timeline };
  if (final_price) updates.final_price = final_price;
  if (loan_details) updates.loan_details = loan_details;
  if (status === 'completed') {
    updates.completed_at = new Date();
    // Mark property as sold
    await transaction.property.update({ status: 'sold' });
  }

  await transaction.update(updates);
  res.json({ success: true, data: transaction });
}

async function getUserTransactions(req, res) {
  const where = req.user.role === 'broker'
    ? { broker_id: req.user.id }
    : { buyer_id: req.user.id };

  const transactions = await Transaction.findAll({
    where,
    include: [
      { model: Property, as: 'property', attributes: ['id', 'title', 'locality', 'city', 'images'] },
      { model: User, as: 'buyer', attributes: ['id', 'name', 'phone'] },
    ],
    order: [['created_at', 'DESC']],
  });

  res.json({ success: true, data: transactions });
}

module.exports = { makeOffer, updateTransaction, getUserTransactions };
