
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../../common/middleware/auth.middleware');
const Employee = require('../employee/employee.model');
const { Attendance } = require('../attendance/attendance.model');
const { LeaveRequest, LeaveBalance } = require('../leave/leave.model');
 
router.use(authenticate);
 
// Headcount report
router.get('/headcount', authorize('hr_admin', 'leadership'), async (req, res) => {
  try {
    const { department, location } = req.query;
    const filter = { tenantId: req.tenantId, isDeleted: false };
    if (department) filter.department = department;
    if (location) filter.location = location;
 
    const [total, byDept, byStatus, byType] = await Promise.all([
      Employee.countDocuments({ ...filter, status: 'active' }),
      Employee.aggregate([
        { $match: filter },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      ]),
      Employee.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Employee.aggregate([
        { $match: filter },
        { $group: { _id: '$employmentType', count: { $sum: 1 } } }
      ]),
    ]);
 
    res.json({ success: true, data: { total, byDepartment: byDept, byStatus, byEmploymentType: byType } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// Attendance summary
router.get('/attendance-summary', async (req, res) => {
  try {
    const { fromDate, toDate, department } = req.query;
    const tenantId = req.tenantId;
 
    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);
 
    const matchFilter = { tenantId };
    if (Object.keys(dateFilter).length) matchFilter.date = dateFilter;
 
    const summary = await Attendance.aggregate([
      { $match: matchFilter },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgHours: { $avg: '$totalHours' }
      }}
    ]);
 
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
// Leave utilization report
router.get('/leave-utilization', authorize('hr_admin', 'leadership', 'manager'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
 
    const balances = await LeaveBalance.find({ tenantId: req.tenantId, year })
      .populate('employeeId', 'firstName lastName employeeId department')
      .populate('leaveType', 'name code');
 
    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
 
module.exports = router;
