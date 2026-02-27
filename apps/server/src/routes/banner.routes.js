const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { getBanners, getAllBannersAdmin, createBanner, updateBanner, deleteBanner } = require('../controllers/banner.controller');

router.get('/', getBanners);
router.get('/admin/all', auth, roleGuard('admin', 'superadmin'), getAllBannersAdmin);
router.post('/', auth, roleGuard('admin', 'superadmin'), createBanner);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), updateBanner);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteBanner);

module.exports = router;
