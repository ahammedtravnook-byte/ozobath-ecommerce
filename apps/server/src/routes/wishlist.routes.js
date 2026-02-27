const router = require('express').Router();
const auth = require('../middleware/auth');
const { getWishlist, addToWishlist, removeFromWishlist } = require('../controllers/remaining.controller');

router.get('/', auth, getWishlist);
router.post('/add', auth, addToWishlist);
router.delete('/remove/:productId', auth, removeFromWishlist);

module.exports = router;
