const express = require('express');
const router = express.Router();
const ctrl = require('./ai.controller');
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');
 
router.use(authenticate);
 
router.post('/search', ctrl.smartSearch);
router.post('/chat', ctrl.hrChat);
router.get('/summary/:employeeId', authorize('hr_admin', 'manager', 'leadership'), ctrl.employeeSummary);
 
module.exports = router;