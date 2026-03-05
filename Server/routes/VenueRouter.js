const express = require('express');
const router = express.Router();
const { createVenue, getAllVenues, getVenueById, deleteVenue, approveVenue, getAllVenuesAdmin, adminDeleteVenue, blockDates, unblockDate } = require('../controllers/VenueController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles, adminOnly } = require('../middleware/roleMiddleware');
const { upload } = require('../config/cloudinary');

router.post('/', protect, authorizeRoles('venueOwner'), upload.array('images', 5), createVenue);
router.get('/', protect, getAllVenues);
router.get('/admin/all', protect, adminOnly, getAllVenuesAdmin);
router.get('/:id', protect, getVenueById);
router.delete('/:id', protect, authorizeRoles('venueOwner', 'admin'), deleteVenue);
router.delete('/:id/admin', protect, adminOnly, adminDeleteVenue);
router.patch('/:id/approve', protect, adminOnly, approveVenue);
router.patch('/:id/block-dates', protect, authorizeRoles('venueOwner'), blockDates);
router.patch('/:id/unblock-date', protect, authorizeRoles('venueOwner'), unblockDate);

module.exports = router;