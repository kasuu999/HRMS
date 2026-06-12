const express = require('express');
const router = express.Router();
const ctrl = require('./leave.controller');
const { authenticate, authorize } = require('../common/middleware/auth.middleware');

router.use(authenticate);

router.get('/types', ctrl.getLeaveTypes);
router.post('/types', authorize('hr_admin'), ctrl.createLeaveType);
router.get('/balance', ctrl.getLeaveBalance);
router.post('/apply', ctrl.applyLeave);
router.get('/', ctrl.getLeaveRequests);
router.put('/:id/approve', authorize('manager', 'hr_admin'), ctrl.handleLeaveRequest);
router.put('/:id/cancel', ctrl.cancelLeave);

module.exports = router;
