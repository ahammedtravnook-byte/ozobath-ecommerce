const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } = require('../controllers/remaining.controller');

router.get('/', getTestimonials);
router.post('/', auth, roleGuard('admin', 'superadmin'), validate(S.testimonial), createTestimonial);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), validate(S.testimonial), updateTestimonial);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteTestimonial);

module.exports = router;
