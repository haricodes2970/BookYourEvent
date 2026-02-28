const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/AuthController');

router.post('/register', registerUser);
router.post('/login', loginUser);

const { verifyToken } = require('../middleware/authMiddleware');


module.exports = router;