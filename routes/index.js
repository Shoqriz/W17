const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const bloggerRoutes = require('./blogger');
const moderatorRoutes = require('./moderator');

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/blogger', bloggerRoutes);
router.use('/moderator', moderatorRoutes);

module.exports = router;