const express = require('express');
const router = express.Router();
const { getPlatformStats } = require('../controllers/StatsController');

router.get('/', getPlatformStats);  // public — no auth needed

module.exports = router;