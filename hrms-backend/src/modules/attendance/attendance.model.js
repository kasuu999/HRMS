const mongoose = require('mongoose');

// Shift model
const shiftSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['fixed', 'flexible', 'rotational'], default: 'fixed' },
  startTime: { type: String, required: true }, // "09:00"
  endTime: { type: String, required: true },   // "18:00"
  totalHours: { type: Number, default: 9 },
  graceMinutes: { type: Number, default: 15 },       // Grace period for late
  halfDayHours: { type: Number, default: 4.5 },
  overtimeThresholdHours: { type: Number, default: 9 },
  weeklyOffs: [{ type: String, enum: ['sun','mon','tue','wed','thu','fri','sat'] }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Attendance Record
const attendanceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },

  punchIn: Date,
  punchOut: Date,
  punchInLocation: { lat: Number, lng: Number },
  punchOutLocation: { lat: Number, lng: Number },
  punchInMode: { type: String, enum: ['web', 'mobile', 'biometric', 'ip'], default: 'web' },
  punchInIP: String,

  totalHours: { type: Number, default: 0 },
  overtimeHours: { type: Number, default: 0 },

  status: {
    type: String,
    enum: ['present', 'absent', 'half_day', 'late', 'on_leave', 'holiday', 'weekly_off', 'work_from_home'],
    default: 'absent'
  },
  isLate: { type: Boolean, default: false },
  lateMinutes: { type: Number, default: 0 },

  shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },

  // Regularization
  isRegularized: { type: Boolean, default: false },
  regularizationRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'RegularizationRequest' },

  notes: String,
}, { timestamps: true });

attendanceSchema.index({ tenantId: 1, employeeId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ tenantId: 1, date: 1 });

// Regularization Request
const regularizationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  date: { type: Date, required: true },
  requestedPunchIn: Date,
  requestedPunchOut: Date,
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  approver: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  approverComment: String,
  approvedAt: Date,
}, { timestamps: true });

module.exports = {
  Shift: mongoose.model('Shift', shiftSchema),
  Attendance: mongoose.model('Attendance', attendanceSchema),
  RegularizationRequest: mongoose.model('RegularizationRequest', regularizationSchema),
};