// ============================================
// OZOBATH - Shipping Routes
// ============================================
const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const {
  createShipment, getShippingRates, trackShipment, assignCourier,
  cancelShipment, handleWebhook, getAllShipments,
} = require('../controllers/shipping.controller');

// Public
router.get('/rates', getShippingRates);
router.post('/webhook', handleWebhook);

// Customer
router.get('/track/:orderId', auth, trackShipment);

// Admin
router.post('/create/:orderId', auth, roleGuard('admin', 'superadmin'), createShipment);
router.post('/assign/:orderId', auth, roleGuard('admin', 'superadmin'), assignCourier);
router.post('/cancel/:orderId', auth, roleGuard('admin', 'superadmin'), cancelShipment);
router.get('/all', auth, roleGuard('admin', 'superadmin'), getAllShipments);

module.exports = router;
