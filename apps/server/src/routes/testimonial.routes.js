const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial } = require('../controllers/remaining.controller');

router.get('/', getTestimonials);
router.post('/', auth, roleGuard('admin', 'superadmin'), createTestimonial);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), updateTestimonial);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteTestimonial);

module.exports = router;
