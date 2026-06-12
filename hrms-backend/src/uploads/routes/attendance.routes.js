const express = require('express');
const router = express.Router();
const ctrl = require('./attendance.controller');
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');
 
router.use(authenticate);
 
router.post('/punch', ctrl.punch);
router.get('/today', ctrl.getTodayStatus);
router.get('/', ctrl.getAttendance);
router.post('/regularize', ctrl.requestRegularization);
router.put('/regularize/:id/approve', authorize('manager', 'hr_admin'), ctrl.handleRegularization);
router.get('/shifts', ctrl.getShifts);
router.post('/shifts', authorize('hr_admin'), ctrl.createShift);
 
module.exports = router;
 

