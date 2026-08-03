const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const { getBlogs, getBlogBySlug, createBlog, updateBlog, deleteBlog, getAllBlogsAdmin } = require('../controllers/remaining.controller');

router.get('/', getBlogs);
router.get('/admin/all', auth, roleGuard('admin', 'superadmin'), getAllBlogsAdmin);
router.get('/:slug', getBlogBySlug);
router.post('/', auth, roleGuard('admin', 'superadmin'), validate(S.blog), createBlog);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), validate(S.blog), updateBlog);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteBlog);

module.exports = router;
