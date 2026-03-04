const express = require('express');
const router = express.Router();
const { createVenue, getAllVenues, getVenueById, deleteVenue, approveVenue, getAllVenuesAdmin, adminDeleteVenue } = require('../controllers/VenueController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles, adminOnly } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('venueOwner'), createVenue);
router.get('/', protect, getAllVenues);
router.get('/admin/all', protect, adminOnly, getAllVenuesAdmin);
router.get('/:id', protect, getVenueById);
router.delete('/:id', protect, authorizeRoles('venueOwner', 'admin'), deleteVenue);
router.delete('/:id/admin', protect, adminOnly, adminDeleteVenue);
router.patch('/:id/approve', protect, adminOnly, approveVenue);

module.exports = router;