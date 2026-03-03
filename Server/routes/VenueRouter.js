const express = require('express');
const router = express.Router();
const { createVenue, getAllVenues, getVenueById, deleteVenue, approveVenue } = require('../controllers/VenueController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/create', protect, authorizeRoles('venueOwner'), createVenue);
router.get('/all', protect, getAllVenues);
router.get('/:id', protect, getVenueById);
router.delete('/:id', protect, authorizeRoles('venueOwner', 'admin'), deleteVenue);
router.patch('/:id/approve', protect, authorizeRoles('admin'), approveVenue);

module.exports = router;