const express = require('express');
const router = express.Router();
const { authenticate } = require('../common/middleware/auth.middleware');

router.use(authenticate);

// Pending approvals for logged-in manager/admin
router.get('/pending', async (req, res) => {
  try {
    const { LeaveRequest } = require('../leave/leave.model');
    const { RegularizationRequest } = require('../modules/attendance/attendance.model');
    const Employee = require('../employee/employee.model');

    const tenantId = req.tenantId;
    let empFilter = {};

    if (req.user.role === 'manager') {
      const team = await Employee.find({ tenantId, reportingManager: req.user.employeeId }).select('_id');
      empFilter = { employeeId: { $in: team.map(e => e._id) } };
    }

    const [leaveRequests, regularizations] = await Promise.all([
      LeaveRequest.find({ tenantId, status: 'pending', ...empFilter })
        .populate('employeeId', 'firstName lastName employeeId photo')
        .populate('leaveType', 'name code color')
        .sort({ createdAt: -1 })
        .limit(20),
      RegularizationRequest.find({ tenantId, status: 'pending', ...empFilter })
        .populate('employeeId', 'firstName lastName employeeId')
        .sort({ createdAt: -1 })
        .limit(20),
    ]);

    res.json({
      success: true,
      data: {
        leaveRequests,
        regularizations,
        totalPending: leaveRequests.length + regularizations.length,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
