const express = require('express');
const router = express.Router();
const { register, verifyOTP, login, getUsers } = require('../controllers/AuthController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.get('/users', protect, adminOnly, getUsers);

module.exports = router;