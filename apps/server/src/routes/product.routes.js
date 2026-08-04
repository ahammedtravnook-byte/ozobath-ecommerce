const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { uploadSheet } = require('../middleware/upload');
const { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct, getAllProductsAdmin, getProductByIdAdmin } = require('../controllers/product.controller');
const { bulkUploadProducts, downloadTemplate } = require('../controllers/bulkUpload.controller');

const adminOnly = [auth, roleGuard('admin', 'superadmin')];

router.get('/', getProducts);
router.get('/admin/all', ...adminOnly, getAllProductsAdmin);
router.get('/admin/:id', ...adminOnly, getProductByIdAdmin);

// Bulk upload — must be before /:slug
router.get('/bulk-upload/template', ...adminOnly, downloadTemplate);
// Uses the spreadsheet uploader, not the image one — the image MIME filter
// rejected every .xlsx, so this endpoint could not previously succeed.
router.post('/bulk-upload', ...adminOnly, uploadSheet.single('excel'), bulkUploadProducts);

router.get('/:slug', getProductBySlug);
router.post('/', ...adminOnly, createProduct);
router.put('/:id', ...adminOnly, updateProduct);
router.delete('/:id', ...adminOnly, deleteProduct);

module.exports = router;
