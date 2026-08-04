const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const { getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory, getAllCategoriesAdmin } = require('../controllers/category.controller');

router.get('/', getCategories);
router.get('/admin/all', auth, roleGuard('admin', 'superadmin'), getAllCategoriesAdmin);
router.get('/:slug', getCategoryBySlug);
router.post('/', auth, roleGuard('admin', 'superadmin'), validate(S.category), createCategory);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), validate(S.category), updateCategory);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteCategory);

module.exports = router;
