const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { makeOffer, updateTransaction, getUserTransactions } = require('../controllers/transactionController');

const router = express.Router();

router.post('/offer', authenticate, makeOffer);
router.get('/my', authenticate, getUserTransactions);
router.patch('/:id', authenticate, updateTransaction);

module.exports = router;
