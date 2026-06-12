
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
 
const userSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: {
    type: String,
    enum: ['employee', 'manager', 'hr_admin', 'leadership'],
    default: 'employee'
  },
  permissions: [{ type: String }], // Custom granular permissions
  isActive: { type: Boolean, default: true },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, select: false },
  refreshToken: { type: String, select: false },
 
  // Password & security
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  failedLoginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
 
  // SSO
  googleId: String,
  microsoftId: String,
 
  lastLogin: Date,
}, {
  timestamps: true
});
 
// Compound unique index: email unique per tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
 
// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  next();
});
 
// Check if account is locked
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});
 
// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};
 
// Increment failed login attempts
userSchema.methods.incLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { failedLoginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  const updates = { $inc: { failedLoginAttempts: 1 } };
  if (this.failedLoginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }; // lock 15 min
  }
  return this.updateOne(updates);
};
 
module.exports = mongoose.model('User', userSchema);