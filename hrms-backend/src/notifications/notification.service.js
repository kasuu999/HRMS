const mongoose = require('mongoose');

// Inline schema to avoid circular imports
const notificationSchema = new mongoose.Schema({
  tenantId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:      { type: String, required: true },
  message:    { type: String, required: true },
  type:       { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  module:     String,
  resourceId: String,
  isRead:     { type: Boolean, default: false },
  readAt:     Date,
}, { timestamps: true });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

/**
 * Create a notification for a specific user.
 * @param {object} opts
 * @param {ObjectId} opts.tenantId
 * @param {ObjectId} opts.userId       - User._id who should receive the notification
 * @param {string}   opts.title
 * @param {string}   opts.message
 * @param {string}   [opts.type]       - 'info' | 'success' | 'warning' | 'error'
 * @param {string}   [opts.module]     - e.g. 'leave', 'attendance'
 * @param {string}   [opts.resourceId] - related document id (as string)
 */
const createNotification = async (opts) => {
  try {
    await Notification.create({
      tenantId:   opts.tenantId,
      userId:     opts.userId,
      title:      opts.title,
      message:    opts.message,
      type:       opts.type || 'info',
      module:     opts.module,
      resourceId: opts.resourceId ? String(opts.resourceId) : undefined,
    });
  } catch (err) {
    // Non-fatal — log but don't crash the caller
    console.error('[NotificationService] Failed to create notification:', err.message);
  }
};

/**
 * Helper: look up the User._id that belongs to an Employee._id.
 * Returns null if not found.
 */
const getUserIdByEmployeeId = async (employeeId) => {
  try {
    const User = require('mongoose').model('User');
    const user = await User.findOne({ employeeId }).select('_id').lean();
    return user ? user._id : null;
  } catch {
    return null;
  }
};

module.exports = { createNotification, getUserIdByEmployeeId, Notification };
