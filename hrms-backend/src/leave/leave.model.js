const mongoose = require('mongoose');

// Leave Type
const leaveTypeSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  name: { type: String, required: true }, // e.g. "Casual Leave"
  code: { type: String, required: true }, // e.g. "CL"
  type: {
    type: String,
    enum: ['casual', 'sick', 'earned', 'comp_off', 'maternity', 'paternity', 'lop', 'custom'],
    required: true
  },
  isPaid: { type: Boolean, default: true },
  isCarryForward: { type: Boolean, default: false },
  maxCarryForward: { type: Number, default: 0 },
  isEncashable: { type: Boolean, default: false },
  allowHalfDay: { type: Boolean, default: true },
  allowHourly: { type: Boolean, default: false },
  maxConsecutiveDays: { type: Number, default: 30 },
  noticePeriodDays: { type: Number, default: 0 },
  maxBalancePerYear: { type: Number, default: 12 },
  isActive: { type: Boolean, default: true },
  color: { type: String, default: '#4CAF50' },
}, { timestamps: true });

// Leave Policy (accrual rules per type)
const leavePolicySchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  accrualType: { type: String, enum: ['monthly', 'quarterly', 'annually', 'upfront'], default: 'monthly' },
  accrualDays: { type: Number, default: 1 },
  eligibilityDays: { type: Number, default: 0 }, // days after joining
  applicableGrades: [String],
  applicableLocations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Location' }],
  yearStartMonth: { type: Number, default: 4 }, // April
}, { timestamps: true });

// Leave Balance
const leaveBalanceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  year: { type: Number, required: true },
  totalEntitled: { type: Number, default: 0 },
  taken: { type: Number, default: 0 },
  pending: { type: Number, default: 0 }, // approved but not yet taken
  balance: { type: Number, default: 0 },
  carryForward: { type: Number, default: 0 },
  lapsedDays: { type: Number, default: 0 },
}, { timestamps: true });
leaveBalanceSchema.index({ tenantId: 1, employeeId: 1, leaveType: 1, year: 1 }, { unique: true });

// Leave Request
const leaveRequestSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  leaveType: { type: mongoose.Schema.Types.ObjectId, ref: 'LeaveType', required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  days: { type: Number, required: true },
  dayType: { type: String, enum: ['full_day', 'half_day', 'hourly'], default: 'full_day' },
  halfDayPeriod: { type: String, enum: ['morning', 'afternoon'] },
  reason: { type: String, required: true },
  attachments: [String],

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'withdrawn'],
    default: 'pending'
  },

  // Approval chain
  approvers: [{
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    order: Number,
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    comment: String,
    actionAt: Date,
  }],
  currentApprovalLevel: { type: Number, default: 0 },

  isLOP: { type: Boolean, default: false }, // loss of pay
  cancellationReason: String,
}, { timestamps: true });

leaveRequestSchema.index({ tenantId: 1, employeeId: 1, fromDate: 1 });
leaveRequestSchema.index({ tenantId: 1, status: 1 });

module.exports = {
  LeaveType: mongoose.model('LeaveType', leaveTypeSchema),
  LeavePolicy: mongoose.model('LeavePolicy', leavePolicySchema),
  LeaveBalance: mongoose.model('LeaveBalance', leaveBalanceSchema),
  LeaveRequest: mongoose.model('LeaveRequest', leaveRequestSchema),
};