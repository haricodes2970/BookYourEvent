const express = require('express');
const router = express.Router();
const {
    createOrder,
    verifyPayment,
    getMyPayments,
    getAdminRevenue,
} = require('../controllers/PaymentController');
const { protect }    = require('../middleware/authMiddleware');
const { adminOnly }  = require('../middleware/roleMiddleware');

// Booker — create Razorpay order + booking
router.post('/create-order', protect, createOrder);

// Booker — verify payment after Razorpay success
router.post('/verify', protect, verifyPayment);

// Booker — see own payment history
router.get('/my-payments', protect, getMyPayments);

// Admin — see total platform revenue
router.get('/admin-stats', protect, adminOnly, getAdminRevenue);

module.exports = router;
