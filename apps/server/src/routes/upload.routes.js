const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const upload = require('../middleware/upload');
const { uploadImage, uploadImages, deleteImage } = require('../controllers/upload.controller');

router.post('/image', auth, roleGuard('admin', 'superadmin'), upload.single('image'), uploadImage);
router.post('/images', auth, roleGuard('admin', 'superadmin'), upload.array('images', 10), uploadImages);
router.delete('/image/:publicId', auth, roleGuard('admin', 'superadmin'), deleteImage);

module.exports = router;
