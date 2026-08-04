const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const { createOrder, getMyOrders, getMyOrderById, cancelOrder, getAllOrders, getOrderById, updateOrderStatus, exportOrders, downloadInvoice } = require('../controllers/order.controller');

router.post('/', auth, validate(S.createOrder), createOrder);
router.get('/my-orders', auth, getMyOrders);
router.get('/my-orders/:id', auth, getMyOrderById);
// Declared before the admin `/:id` route below — Express matches in order,
// and a bare `/:id` would otherwise swallow this path.
router.get('/my-orders/:id/invoice', auth, downloadInvoice);
router.post('/:id/cancel', auth, validate(S.cancelOrder), cancelOrder);
router.get('/', auth, roleGuard('admin', 'superadmin'), getAllOrders);
router.get('/export', auth, roleGuard('admin', 'superadmin'), exportOrders);
router.get('/:id', auth, roleGuard('admin', 'superadmin'), getOrderById);
router.put('/:id/status', auth, roleGuard('admin', 'superadmin'), validate(S.updateOrderStatus), updateOrderStatus);

module.exports = router;
