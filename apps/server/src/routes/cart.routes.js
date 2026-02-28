const router = require('express').Router();
const auth = require('../middleware/auth');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, mergeGuestCart } = require('../controllers/cart.controller');

router.get('/', auth, getCart);
router.post('/add', auth, addToCart);
router.post('/merge', auth, mergeGuestCart);
router.put('/update', auth, updateCartItem);
router.delete('/remove/:itemId', auth, removeFromCart);
router.delete('/clear', auth, clearCart);

module.exports = router;

