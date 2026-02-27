const router = require('express').Router();
const auth = require('../middleware/auth');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cart.controller');

router.get('/', auth, getCart);
router.post('/add', auth, addToCart);
router.put('/update', auth, updateCartItem);
router.delete('/remove/:itemId', auth, removeFromCart);
router.delete('/clear', auth, clearCart);

module.exports = router;
