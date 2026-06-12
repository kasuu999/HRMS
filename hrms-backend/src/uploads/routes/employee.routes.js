const express = require('express');
const router = express.Router();
const ctrl = require('./employee.controller');
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');
 
// All routes require authentication
router.use(authenticate);
 
// Employee directory & CRUD
router.get('/', ctrl.getEmployees);
router.post('/', authorize('hr_admin'), ctrl.createEmployee);
router.get('/org-chart', ctrl.getOrgChart);
router.get('/:id', ctrl.getEmployee);
router.put('/:id', authorize('hr_admin', 'manager'), ctrl.updateEmployee);
router.post('/:id/exit', authorize('hr_admin'), ctrl.exitEmployee);
 
// Org structure
router.get('/org/departments', ctrl.getDepartments);
router.post('/org/departments', authorize('hr_admin'), ctrl.createDepartment);
router.get('/org/designations', ctrl.getDesignations);
router.post('/org/designations', authorize('hr_admin'), ctrl.createDesignation);
router.get('/org/locations', ctrl.getLocations);
router.post('/org/locations', authorize('hr_admin'), ctrl.createLocation);
 
module.exports = router;
 

