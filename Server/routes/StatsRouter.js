const express = require('express');
const router = express.Router();
const { getPlatformStats } = require('../controllers/StatsController');

router.get('/', getPlatformStats);

module.exports = router;