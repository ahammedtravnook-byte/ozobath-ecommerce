const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getProductReviews, createReview, getAllReviewsAdmin, approveReview, deleteReview, voteReviewHelpful } = require('../controllers/remaining.controller');

router.get('/product/:productId', getProductReviews);
router.post('/', auth, createReview);
router.post('/:id/helpful', auth, voteReviewHelpful);
router.get('/admin/all', auth, roleGuard('admin', 'superadmin'), getAllReviewsAdmin);
router.put('/admin/:id', auth, roleGuard('admin', 'superadmin'), approveReview);
router.delete('/admin/:id', auth, roleGuard('admin', 'superadmin'), deleteReview);

module.exports = router;
