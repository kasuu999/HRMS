const { LeaveType, LeaveBalance, LeaveRequest } = require('./leave.model');
const Employee = require('../employee/employee.model');
const { Attendance } = require('../modules/attendance/attendance.model');

// Calculate business days between two dates (excluding weekends)
const calcBusinessDays = (from, to) => {
  let days = 0;
  const current = new Date(from);
  while (current <= to) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) days++;
    current.setDate(current.getDate() + 1);
  }
  return days;
};

// @GET /api/leave/types — Get leave types
exports.getLeaveTypes = async (req, res) => {
  try {
    const types = await LeaveType.find({ tenantId: req.tenantId, isActive: true });
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/leave/types — Create leave type
exports.createLeaveType = async (req, res) => {
  try {
    const leaveType = await LeaveType.create({ ...req.body, tenantId: req.tenantId });
    res.status(201).json({ success: true, data: leaveType });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/leave/balance — Get employee leave balances
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.query;
    const empId = req.user.role === 'employee' ? req.user.employeeId : (employeeId || req.user.employeeId);
    const year = new Date().getFullYear();

    const balances = await LeaveBalance.find({ tenantId: req.tenantId, employeeId: empId, year })
      .populate('leaveType', 'name code color type');

    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/leave/apply — Apply for leave
exports.applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, fromDate, toDate, reason, dayType = 'full_day', halfDayPeriod } = req.body;
    const employeeId = req.user.employeeId;
    const tenantId = req.tenantId;

    const from = new Date(fromDate);
    const to = new Date(toDate);
    const year = from.getFullYear();

    // Calculate days
    let days = dayType === 'half_day' ? 0.5 : calcBusinessDays(from, to);

    // Check for overlapping requests
    const overlap = await LeaveRequest.findOne({
      tenantId, employeeId,
      status: { $in: ['pending', 'approved'] },
      $or: [
        { fromDate: { $lte: to }, toDate: { $gte: from } }
      ]
    });
    if (overlap) {
      return res.status(409).json({
        success: false,
        message: 'Leave request overlaps with an existing request'
      });
    }

    // Check leave balance
    const balance = await LeaveBalance.findOne({ tenantId, employeeId, leaveType: leaveTypeId, year });
    const leaveType = await LeaveType.findById(leaveTypeId);

    if (!leaveType) return res.status(404).json({ success: false, message: 'Leave type not found' });

    if (balance && balance.balance < days && leaveType.type !== 'lop') {
      return res.status(400).json({
        success: false,
        message: `Insufficient leave balance. Available: ${balance?.balance || 0}, Requested: ${days}`
      });
    }

    // Get approver (reporting manager)
    const employee = await Employee.findById(employeeId);
    const approvers = [];
    if (employee.reportingManager) {
      approvers.push({ employeeId: employee.reportingManager, order: 1, status: 'pending' });
    }

    const isLOP = leaveType.type === 'lop' || (balance && balance.balance < days);

    const request = await LeaveRequest.create({
      tenantId, employeeId, leaveType: leaveTypeId,
      fromDate: from, toDate: to, days, dayType, halfDayPeriod,
      reason, approvers, isLOP,
    });

    // Reserve balance (pending state)
    if (balance) {
      balance.pending += days;
      await balance.save();
    }

    res.status(201).json({ success: true, message: 'Leave request submitted', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/leave — Get leave requests
exports.getLeaveRequests = async (req, res) => {
  try {
    const { status, employeeId, fromDate, toDate, page = 1, limit = 20 } = req.query;
    const tenantId = req.tenantId;

    const filter = { tenantId };

    if (req.user.role === 'employee') {
      filter.employeeId = req.user.employeeId;
    } else if (req.user.role === 'manager') {
      const team = await Employee.find({ tenantId, reportingManager: req.user.employeeId }).select('_id');
      filter.employeeId = { $in: team.map(e => e._id) };
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (status) filter.status = status;
    if (fromDate || toDate) {
      filter.fromDate = {};
      if (fromDate) filter.fromDate.$gte = new Date(fromDate);
      if (toDate) filter.fromDate.$lte = new Date(toDate);
    }

    const total = await LeaveRequest.countDocuments(filter);
    const requests = await LeaveRequest.find(filter)
      .populate('employeeId', 'firstName lastName employeeId photo')
      .populate('leaveType', 'name code color')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: requests, pagination: { total, page: parseInt(page) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/leave/:id/approve — Approve or reject
exports.handleLeaveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    const tenantId = req.tenantId;

    const request = await LeaveRequest.findOne({ _id: id, tenantId }).populate('leaveType');
    if (!request) return res.status(404).json({ success: false, message: 'Leave request not found' });

    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Request is already ${request.status}` });
    }

    const isApproved = action === 'approve';
    request.status = isApproved ? 'approved' : 'rejected';

    // Update approver record
    const approverRecord = request.approvers.find(
      a => a.employeeId?.toString() === req.user.employeeId?.toString()
    );
    if (approverRecord) {
      approverRecord.status = isApproved ? 'approved' : 'rejected';
      approverRecord.comment = comment;
      approverRecord.actionAt = new Date();
    }

    await request.save();

    // Update leave balance
    const year = new Date(request.fromDate).getFullYear();
    const balance = await LeaveBalance.findOne({
      tenantId, employeeId: request.employeeId,
      leaveType: request.leaveType._id, year
    });

    if (balance) {
      balance.pending = Math.max(0, balance.pending - request.days);
      if (isApproved) {
        balance.taken += request.days;
        balance.balance = Math.max(0, balance.balance - request.days);
      }
      await balance.save();
    }

    // Mark attendance as on_leave
    if (isApproved) {
      const current = new Date(request.fromDate);
      while (current <= request.toDate) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) {
          const dateKey = new Date(current);
          dateKey.setHours(0, 0, 0, 0);
          await Attendance.findOneAndUpdate(
            { tenantId, employeeId: request.employeeId, date: dateKey },
            { status: 'on_leave' },
            { upsert: true, setDefaultsOnInsert: true }
          );
        }
        current.setDate(current.getDate() + 1);
      }
    }

    res.json({ success: true, message: `Leave ${action}d successfully`, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/leave/:id/cancel — Cancel leave
exports.cancelLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await LeaveRequest.findOne({ _id: id, tenantId: req.tenantId });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (!['pending', 'approved'].includes(request.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this request' });
    }

    const wasPending = request.status === 'pending';
    request.status = 'cancelled';
    request.cancellationReason = reason;
    await request.save();

    // Restore balance
    const year = new Date(request.fromDate).getFullYear();
    const balance = await LeaveBalance.findOne({
      tenantId: req.tenantId, employeeId: request.employeeId,
      leaveType: request.leaveType, year
    });
    if (balance) {
      if (wasPending) balance.pending = Math.max(0, balance.pending - request.days);
      else {
        balance.taken = Math.max(0, balance.taken - request.days);
        balance.balance += request.days;
      }
      await balance.save();
    }

    res.json({ success: true, message: 'Leave cancelled', data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};



