const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, getAllProductsAdmin } = require('../controllers/product.controller');

router.get('/', getProducts);
router.get('/admin/all', auth, roleGuard('admin', 'superadmin'), getAllProductsAdmin);
router.get('/:slug', getProductBySlug);
router.post('/', auth, roleGuard('admin', 'superadmin'), createProduct);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), updateProduct);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteProduct);

module.exports = router;
