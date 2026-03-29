const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../../models/User');
const { runQuery } = require('../../config/neo4j');
const logger = require('../../config/logger');

function generateTokens(userId) {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken };
}

async function register(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { name, email, phone, password, role, city } = req.body;

  try {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password_hash: password,
      role: role || 'buyer',
      city,
    });

    // Create node in Neo4j graph
    await runQuery(
      `CREATE (u:User {id: $id, name: $name, role: $role, city: $city})`,
      { id: user.id, name: user.name, role: user.role, city: user.city || '' }
    );

    const { accessToken, refreshToken } = generateTokens(user.id);
    logger.info(`New user registered: ${user.email} [${user.role}]`);

    res.status(201).json({
      success: true,
      data: { user: user.toPublicJSON(), accessToken, refreshToken },
    });
  } catch (err) {
    logger.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account is disabled' });
    }

    await user.update({ last_login: new Date() });
    const { accessToken, refreshToken } = generateTokens(user.id);

    res.json({
      success: true,
      data: { user: user.toPublicJSON(), accessToken, refreshToken },
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
}

async function refreshToken(req, res) {
  const { refreshToken: token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    const { accessToken, refreshToken: newRefresh } = generateTokens(user.id);
    res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch {
    res.status(401).json({ success: false, message: 'Token expired or invalid' });
  }
}

module.exports = { register, login, refreshToken };
