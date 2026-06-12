const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g. 'LOGIN', 'UPDATE_EMPLOYEE', 'APPROVE_LEAVE'
  module: { type: String, required: true }, // e.g. 'auth', 'employee', 'leave'
  resourceId: String, // ID of the affected resource
  resourceType: String,
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  status: { type: String, enum: ['success', 'failure'], default: 'success' },
  message: String,
}, {
  timestamps: true
});

// Indexes for fast querying
auditLogSchema.index({ tenantId: 1, createdAt: -1 });
auditLogSchema.index({ tenantId: 1, userId: 1 });
auditLogSchema.index({ tenantId: 1, module: 1 });

// Immutable - no updates allowed
auditLogSchema.set('strict', true);

module.exports = mongoose.model('AuditLog', auditLogSchema);