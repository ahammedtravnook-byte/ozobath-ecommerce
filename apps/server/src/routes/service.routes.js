const router = require('express').Router();
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const { publicWriteLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const S = require('../schemas');
const { createServiceRequest, getServiceRequests, updateServiceRequest } = require('../controllers/remaining.controller');

router.post('/', publicWriteLimiter, validate(S.serviceRequest), createServiceRequest);
router.get('/', auth, roleGuard('admin', 'superadmin'), getServiceRequests);
router.put('/:id', auth, roleGuard('admin', 'superadmin'), updateServiceRequest);

module.exports = router;
