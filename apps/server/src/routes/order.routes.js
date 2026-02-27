const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { createOrder, getMyOrders, getMyOrderById, getAllOrders, getOrderById, updateOrderStatus } = require('../controllers/order.controller');

router.post('/', auth, createOrder);
router.get('/my-orders', auth, getMyOrders);
router.get('/my-orders/:id', auth, getMyOrderById);
router.get('/', auth, roleGuard('admin', 'superadmin'), getAllOrders);
router.get('/:id', auth, roleGuard('admin', 'superadmin'), getOrderById);
router.put('/:id/status', auth, roleGuard('admin', 'superadmin'), updateOrderStatus);

module.exports = router;
