const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
  getAvailableSlots, bookVideoCall, createVideoCallSlot, getAllVideoCallBookings, updateVideoCallSlot,
  bookSiteVisit, getSiteVisitBookings, updateSiteVisitBooking,
} = require('../controllers/remaining.controller');

// Video Call Slots
router.get('/video-call/available', getAvailableSlots);
router.post('/video-call', bookVideoCall);
router.get('/video-call', auth, roleGuard('admin', 'superadmin'), getAllVideoCallBookings);
router.post('/video-call/create-slot', auth, roleGuard('admin', 'superadmin'), createVideoCallSlot);
router.put('/video-call/:id', auth, roleGuard('admin', 'superadmin'), updateVideoCallSlot);

// Site Visit Bookings
router.post('/site-visit', bookSiteVisit);
router.get('/site-visit', auth, roleGuard('admin', 'superadmin'), getSiteVisitBookings);
router.put('/site-visit/:id', auth, roleGuard('admin', 'superadmin'), updateSiteVisitBooking);

module.exports = router;
