const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { publicWriteLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const {
  getAvailableSlots, bookVideoCall, createVideoCallSlot, createBulkVideoCallSlots,
  getAllVideoCallSlots, getAllVideoCallBookings, updateVideoCallSlot, deleteVideoCallSlot,
  bookSiteVisit, getSiteVisitBookings, updateSiteVisitBooking,
} = require('../controllers/remaining.controller');

// Video Call Slots
router.get('/video-call/available', getAvailableSlots);
router.post('/video-call', publicWriteLimiter, validate(S.videoCallBooking), bookVideoCall);
router.get('/video-call/all', auth, roleGuard('admin', 'superadmin'), getAllVideoCallSlots);
router.get('/video-call', auth, roleGuard('admin', 'superadmin'), getAllVideoCallBookings);
router.post('/video-call/create-slot', auth, roleGuard('admin', 'superadmin'), createVideoCallSlot);
router.post('/video-call/create-bulk', auth, roleGuard('admin', 'superadmin'), createBulkVideoCallSlots);
router.put('/video-call/:id', auth, roleGuard('admin', 'superadmin'), updateVideoCallSlot);
router.delete('/video-call/:id', auth, roleGuard('admin', 'superadmin'), deleteVideoCallSlot);

// Site Visit Bookings
router.post('/site-visit', publicWriteLimiter, validate(S.siteVisit), bookSiteVisit);
router.get('/site-visit', auth, roleGuard('admin', 'superadmin'), getSiteVisitBookings);
router.put('/site-visit/:id', auth, roleGuard('admin', 'superadmin'), updateSiteVisitBooking);

module.exports = router;
