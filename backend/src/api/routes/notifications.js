const express = require('express');
const { authenticate } = require('../middleware/auth');
const { notificationService } = require('../../services/notificationService');

const router = express.Router();

router.get('/', authenticate, async (req, res) => {
  const notifications = await notificationService.getInAppNotifications(req.user.id);
  res.json({ success: true, data: notifications });
});

router.post('/mark-read', authenticate, async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  res.json({ success: true });
});

module.exports = router;
