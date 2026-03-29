const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../../models/User');

const router = express.Router();

router.get('/me', authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

router.put('/me', authenticate, async (req, res) => {
  const { name, city, preferences, profile_image, rera_number } = req.body;
  await req.user.update({ name, city, preferences, profile_image, rera_number });
  res.json({ success: true, data: req.user.toPublicJSON() });
});

router.get('/:id', authenticate, authorize('admin'), async (req, res) => {
  const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password_hash'] } });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});

module.exports = router;
