const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const { getFAQs, createFAQ, updateFAQ, deleteFAQ } = require('../controllers/remaining.controller');

router.get('/', getFAQs);
router.post('/', auth, roleGuard('admin', 'superadmin'), validate(S.faq), createFAQ);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), validate(S.faq), updateFAQ);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteFAQ);

module.exports = router;
