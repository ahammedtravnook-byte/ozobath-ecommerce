const router = require('express').Router();
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart, mergeGuestCart } = require('../controllers/cart.controller');

router.get('/', auth, getCart);
router.post('/add', auth, validate(S.addToCart), addToCart);
router.post('/merge', auth, validate(S.mergeCart), mergeGuestCart);
router.put('/update', auth, validate(S.updateCartItem), updateCartItem);
router.delete('/remove/:itemId', auth, removeFromCart);
router.delete('/clear', auth, clearCart);

module.exports = router;

