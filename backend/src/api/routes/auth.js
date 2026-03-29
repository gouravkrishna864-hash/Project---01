const express = require('express');
const { body } = require('express-validator');
const { register, login, refreshToken } = require('../controllers/authController');

const router = express.Router();

router.post('/register', [
  body('name').trim().isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('phone').matches(/^[6-9]\d{9}$/),
  body('password').isLength({ min: 8 }),
  body('role').optional().isIn(['buyer', 'broker', 'builder']),
], register);

router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], login);

router.post('/refresh', refreshToken);

module.exports = router;
