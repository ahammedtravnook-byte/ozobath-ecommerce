const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { writeLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const { getProductReviews, createReview, getAllReviewsAdmin, approveReview, deleteReview, voteReviewHelpful } = require('../controllers/remaining.controller');

router.get('/product/:productId', getProductReviews);
router.post('/', auth, writeLimiter, validate(S.createReview), createReview);
router.post('/:id/helpful', auth, writeLimiter, voteReviewHelpful);
router.get('/admin/all', auth, roleGuard('admin', 'superadmin'), getAllReviewsAdmin);
router.put('/admin/:id', auth, roleGuard('admin', 'superadmin'), approveReview);
router.delete('/admin/:id', auth, roleGuard('admin', 'superadmin'), deleteReview);

module.exports = router;
