const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { createServiceRequest, getServiceRequests, updateServiceRequest } = require('../controllers/remaining.controller');

router.post('/', createServiceRequest);
router.get('/', auth, roleGuard('admin', 'superadmin'), getServiceRequests);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), updateServiceRequest);

module.exports = router;
