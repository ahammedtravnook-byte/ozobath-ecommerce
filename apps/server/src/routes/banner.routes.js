const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const { getBanners, getAllBannersAdmin, createBanner, updateBanner, deleteBanner } = require('../controllers/banner.controller');

router.get('/', getBanners);
router.get('/admin/all', auth, roleGuard('admin', 'superadmin'), getAllBannersAdmin);
router.post('/', auth, roleGuard('admin', 'superadmin'), validate(S.banner), createBanner);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), validate(S.banner), updateBanner);
router.delete('/:id', auth, roleGuard('admin', 'superadmin'), deleteBanner);

module.exports = router;
