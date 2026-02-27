const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getPageContent, getAllContent, createContent, updateContent, deleteContent, reorderContent } = require('../controllers/content.controller');

// Public
router.get('/:page', getPageContent);
// Admin
router.get('/', auth, roleGuard('admin', 'superadmin'), getAllContent);
router.post('/', auth, roleGuard('admin', 'superadmin'), createContent);
router.put('/reorder/:page', auth, roleGuard('admin', 'superadmin'), reorderContent);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), updateContent);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteContent);

module.exports = router;
