const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getProductReviews, createReview, getAllReviewsAdmin, approveReview, deleteReview } = require('../controllers/remaining.controller');

router.get('/product/:productId', getProductReviews);
router.post('/', auth, createReview);
router.get('/', auth, roleGuard('admin', 'superadmin'), getAllReviewsAdmin);
router.put('/:id/approve', auth, roleGuard('admin', 'superadmin'), approveReview);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteReview);

module.exports = router;
