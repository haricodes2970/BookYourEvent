const express = require('express');
const router = express.Router();
const { createVenue, getAllVenues, getVenueById, deleteVenue, approveVenue } = require('../controllers/VenueController');
const { verifyToken } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/create', verifyToken, authorizeRoles('venueOwner'), createVenue);
router.get('/all', verifyToken, getAllVenues);
router.get('/:id', verifyToken, getVenueById);
router.delete('/:id', verifyToken, authorizeRoles('venueOwner', 'admin'), deleteVenue);
router.patch('/:id/approve', verifyToken, authorizeRoles('admin'), approveVenue);

module.exports = router;