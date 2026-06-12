const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../common/middleware/auth.middleware');

// Notification model inline
const notificationSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  module: String,
  resourceId: String,
  isRead: { type: Boolean, default: false },
  readAt: Date,
}, { timestamps: true });
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

router.use(authenticate);

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { tenantId: req.tenantId, userId: req.user._id };
    if (unreadOnly === 'true') filter.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(parseInt(limit)),
      Notification.countDocuments({ tenantId: req.tenantId, userId: req.user._id, isRead: false })
    ]);

    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/mark-all-read', async (req, res) => {
  try {
    await Notification.updateMany(
      { tenantId: req.tenantId, userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
