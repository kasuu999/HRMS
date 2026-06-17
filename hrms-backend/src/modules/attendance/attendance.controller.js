const { Attendance, Shift, RegularizationRequest } = require('./attendance.model');
const Employee = require('../../employee/employee.model');
const User = require('../../auth/user.model');
const { createNotification, getUserIdByEmployeeId } = require('../../notifications/notification.service');

// Helper: get employee for current user, auto-create if missing (for admins without employee profile)
const getOrCreateEmployee = async (req) => {
  const tenantId = req.tenantId;
  let employeeId = req.user.employeeId;

  if (employeeId) {
    const emp = await Employee.findOne({ _id: employeeId, tenantId }).populate('shift');
    if (emp) return emp;
  }

  // Try to find an employee record matching this user's email
  let employee = await Employee.findOne({ tenantId, officialEmail: req.user.email }).populate('shift');

  if (!employee) {
    // Auto-create a minimal employee profile for this user (e.g. hr_admin)
    const count = await Employee.countDocuments({ tenantId });
    const empId = `EMP${String(count + 1).padStart(4, '0')}`;

    employee = await Employee.create({
      tenantId,
      employeeId: empId,
      firstName: req.user.email.split('@')[0],
      lastName: '',
      officialEmail: req.user.email,
      status: 'active',
      employmentType: 'full_time',
      dateOfJoining: new Date(),
      userId: req.user._id,
    });
  }

  // Link this employee back to the user account
  await User.findByIdAndUpdate(req.user._id, { employeeId: employee._id });

  return employee;
};

// Calculate attendance status based on shift rules
const calcStatus = (punchIn, punchOut, shift) => {
  if (!punchIn) return { status: 'absent', totalHours: 0, isLate: false, lateMinutes: 0, overtimeHours: 0 };

  const shiftStart = new Date(punchIn);
  const [h, m] = shift.startTime.split(':').map(Number);
  shiftStart.setHours(h, m, 0, 0);

  const lateMinutes = Math.max(0, Math.floor((punchIn - shiftStart) / 60000));
  const isLate = lateMinutes > shift.graceMinutes;

  let totalHours = 0;
  let overtimeHours = 0;

  if (punchOut) {
    totalHours = parseFloat(((punchOut - punchIn) / 3600000).toFixed(2));
    overtimeHours = Math.max(0, parseFloat((totalHours - shift.overtimeThresholdHours).toFixed(2)));
  }

  let status = 'present';
  if (punchOut && totalHours < shift.halfDayHours) status = 'half_day';
  else if (isLate && lateMinutes > 60) status = 'late';

  return { status, totalHours, isLate, lateMinutes, overtimeHours };
};

// @POST /api/attendance/punch — Punch in or out
exports.punch = async (req, res) => {
  try {
    const { lat, lng, mode = 'web', ipAddress } = req.body;
    const tenantId = req.tenantId;

    const employee = await getOrCreateEmployee(req);
    const employeeId = employee._id;

    const shift = employee.shift;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find or create today's attendance record
    let record = await Attendance.findOne({ tenantId, employeeId, date: today });

    if (!record) {
      // First punch = punch in
      record = await Attendance.create({
        tenantId, employeeId,
        date: today,
        punchIn: new Date(),
        punchInLocation: lat && lng ? { lat, lng } : undefined,
        punchInMode: mode,
        punchInIP: ipAddress || req.ip,
        shift: shift?._id,
        status: 'present',
      });

      // Calculate if late
      if (shift) {
        const { isLate, lateMinutes } = calcStatus(record.punchIn, null, shift);
        record.isLate = isLate;
        record.lateMinutes = lateMinutes;
        await record.save();
      }

      return res.json({
        success: true,
        message: `Punched in at ${new Date().toLocaleTimeString()}`,
        data: { type: 'punch_in', record }
      });
    }

    if (!record.punchOut) {
      // Second punch = punch out
      record.punchOut = new Date();
      record.punchOutLocation = lat && lng ? { lat, lng } : undefined;

      if (shift) {
        const calc = calcStatus(record.punchIn, record.punchOut, shift);
        Object.assign(record, calc);
      } else {
        record.totalHours = parseFloat(((record.punchOut - record.punchIn) / 3600000).toFixed(2));
      }

      await record.save();

      return res.json({
        success: true,
        message: `Punched out at ${new Date().toLocaleTimeString()}`,
        data: { type: 'punch_out', record }
      });
    }

    return res.json({
      success: true,
      message: 'Already punched in and out today',
      data: { type: 'already_done', record }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/attendance/today — Get today's status for current user
exports.getTodayStatus = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let employeeId = req.user.employeeId;

    if (!employeeId) {
      const employee = await Employee.findOne({ tenantId: req.tenantId, officialEmail: req.user.email });
      employeeId = employee?._id;
    }

    const record = await Attendance.findOne({
      tenantId: req.tenantId,
      employeeId,
      date: today
    });

    res.json({ success: true, data: record || { status: 'not_punched' } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @GET /api/attendance — Get attendance records (with filters)
exports.getAttendance = async (req, res) => {
  try {
    const { employeeId, fromDate, toDate, status, page = 1, limit = 31 } = req.query;
    const tenantId = req.tenantId;

    const filter = { tenantId };

    // Role-based scoping
    if (req.user.role === 'employee') {
      filter.employeeId = req.user.employeeId;
    } else if (req.user.role === 'manager') {
      // Only team members
      const team = await Employee.find({ tenantId, reportingManager: req.user.employeeId }).select('_id');
      filter.employeeId = { $in: team.map(e => e._id) };
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }

    if (fromDate || toDate) {
      filter.date = {};
      if (fromDate) filter.date.$gte = new Date(fromDate);
      if (toDate) filter.date.$lte = new Date(toDate);
    }
    if (status) filter.status = status;

    const total = await Attendance.countDocuments(filter);
    const records = await Attendance.find(filter)
      .populate('employeeId', 'firstName lastName employeeId')
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({ success: true, data: records, pagination: { total, page: parseInt(page) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/attendance/regularize — Request regularization
exports.requestRegularization = async (req, res) => {
  try {
    const { date, requestedPunchIn, requestedPunchOut, reason } = req.body;
    const employeeId = req.user.employeeId;

    // Check regularization window (current + previous month only)
    const requestDate = new Date(date);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    oneMonthAgo.setDate(1);

    if (requestDate < oneMonthAgo) {
      return res.status(400).json({
        success: false,
        message: 'Regularization allowed only for current and previous month'
      });
    }

    const employee = await Employee.findById(employeeId);
    const req_obj = await RegularizationRequest.create({
      tenantId: req.tenantId,
      employeeId,
      date: requestDate,
      requestedPunchIn: requestedPunchIn ? new Date(requestedPunchIn) : undefined,
      requestedPunchOut: requestedPunchOut ? new Date(requestedPunchOut) : undefined,
      reason,
      approver: employee.reportingManager,
    });

    // Notify the approver (reporting manager)
    if (employee.reportingManager) {
      const approverUserId = await getUserIdByEmployeeId(employee.reportingManager);
      if (approverUserId) {
        await createNotification({
          tenantId: req.tenantId, userId: approverUserId,
          title: 'Regularization Request',
          message: `${employee.firstName} ${employee.lastName} has submitted an attendance regularization request. Please review.`,
          type: 'warning', module: 'attendance', resourceId: req_obj._id,
        });
      }
    }

    res.status(201).json({ success: true, message: 'Regularization request submitted', data: req_obj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @PUT /api/attendance/regularize/:id/approve — Approve/reject
exports.handleRegularization = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body; // action: 'approve' | 'reject'

    const request = await RegularizationRequest.findOne({ _id: id, tenantId: req.tenantId });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.approverComment = comment;
    request.approvedAt = new Date();
    await request.save();

    // Notify the employee about the decision
    const empUserId = await getUserIdByEmployeeId(request.employeeId);
    const isApproved = action === 'approve';
    if (empUserId) {
      await createNotification({
        tenantId: req.tenantId, userId: empUserId,
        title: isApproved ? 'Regularization Approved ✅' : 'Regularization Rejected ❌',
        message: isApproved
          ? `Your attendance regularization request has been approved.${comment ? ' Comment: ' + comment : ''}`
          : `Your attendance regularization request has been rejected.${comment ? ' Reason: ' + comment : ''}`,
        type: isApproved ? 'success' : 'error',
        module: 'attendance', resourceId: request._id,
      });
    }

    if (action === 'approve') {
      // Update the attendance record
      const today = new Date(request.date);
      today.setHours(0, 0, 0, 0);

      await Attendance.findOneAndUpdate(
        { tenantId: req.tenantId, employeeId: request.employeeId, date: today },
        {
          punchIn: request.requestedPunchIn,
          punchOut: request.requestedPunchOut,
          isRegularized: true,
          regularizationRequest: request._id,
          status: 'present',
        },
        { upsert: true }
      );
    }

    res.json({ success: true, message: `Regularization ${action}d`, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @POST /api/attendance/shifts — Create shift
exports.createShift = async (req, res) => {
  try {
    const shift = await Shift.create({ ...req.body, tenantId: req.tenantId });
    res.status(201).json({ success: true, data: shift });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getShifts = async (req, res) => {
  try {
    const shifts = await Shift.find({ tenantId: req.tenantId, isActive: true });
    res.json({ success: true, data: shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};