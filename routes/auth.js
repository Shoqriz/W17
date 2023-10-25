const bcrypt = require('bcrypt');
const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/config');
const memoryCache = require('memory-cache');
const rateLimit = require('express-rate-limit');
const { check, validationResult } = require('express-validator');

const router = express.Router();
const cacheDuration = 3600000;

router.post('/register', [
  check('email').isEmail().withMessage('Valid email address is required'),
  check('username').isLength({ min: 5 }).withMessage('Username is required'),
  check('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long').matches(/^[a-zA-Z0-9]+$/).withMessage('Password must be alphanumeric'),
  check('role').isIn(['blogger', 'admin', 'moderator']).withMessage('Role must be blogger, admin, or moderator'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, username, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) return res.status(400).json({ error: 'Username or email is already taken.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, username, password: hashedPassword, role });
    await user.save();

    res.status(201).json({ message: 'Registration successful.' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  handler: (req, res) => {
    res.status(429).json({ error: 'Too many login attempts. Please try again later.' });
  },
});

router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (!user) return res.status(401).json({ error: 'Username not found.' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid password.' });

    const accessToken = jwt.sign({ userId: user._id, role: user.role }, config.jwtSecret, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user._id, role: user.role }, config.refreshTokenSecret, { expiresIn: '30d' });

    res.cookie('refreshToken', refreshToken, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.json({
      message: 'Login successful',
      accessToken,
      accessToken_expires_in: 15 * 60,
      refreshToken_expires_in: 30 * 24 * 60 * 60,
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

router.get('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token not found.' });

    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
    res.clearCookie('refreshToken', { httpOnly: true });
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.post('/refresh-token', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.status(403).json({ error: 'Refresh token not found.' });

  try {
    const decoded = jwt.verify(refreshToken, config.refreshTokenSecret);
    const accessToken = jwt.sign({ userId: decoded.userId, role: decoded.role }, config.jwtSecret, { expiresIn: '15m' });
    res.json({ accessToken, role: decoded.role });
  } catch (error) {
    res.status(403).json({ error: 'Invalid refresh token.' });
  }
});

router.post('/request-reset-password', async (req, res) => {
  const { email } = req.body;

  try {
    const resetToken = crypto.randomBytes(20).toString('hex');
    const cacheKey = `resetToken_${resetToken}`;
    memoryCache.put(cacheKey, email, cacheDuration);

    res.json({ message: 'Reset password token generated.', resetToken });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate reset password token.' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
  const resetToken = req.params.token;
  const { password } = req.body;

  try {
    const cacheKey = `resetToken_${resetToken}`;
    const email = memoryCache.get(cacheKey);

    if (!email) {
      return res.status(400).json({ error: 'Invalid or expired reset password token.' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: 'User not found.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    memoryCache.del(cacheKey);

    res.json({ message: 'Password reset successful.' });
  } catch (error) {
    res.status(500).json({ error: 'Password reset failed.' });
  }
});

module.exports = router;