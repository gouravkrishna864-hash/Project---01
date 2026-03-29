const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { createLead, getBrokerLeads, updateLeadStatus, getLeadStats } = require('../controllers/leadController');

const router = express.Router();

router.post('/', authenticate, createLead);
router.get('/broker', authenticate, authorize('broker', 'admin'), getBrokerLeads);
router.get('/stats', authenticate, authorize('broker', 'admin'), getLeadStats);
router.patch('/:id/status', authenticate, authorize('broker', 'admin'), updateLeadStatus);

module.exports = router;
