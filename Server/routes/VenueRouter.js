const express = require('express');
const router = express.Router();
const { createVenue, getAllVenues, getVenueById, deleteVenue } = require('../controllers/VenueController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/create', verifyToken, authorizeRoles('venueOwner'), createVenue);
router.get('/all', verifyToken, authorizeRoles('booker', 'venueOwner', 'admin'), getAllVenues);
router.get('/:id', verifyToken, authorizeRoles('booker', 'venueOwner', 'admin'), getVenueById);
router.delete('/:id', verifyToken, authorizeRoles('venueOwner'), deleteVenue);

module.exports = router;