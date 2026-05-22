const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @desc    Get all notifications for the logged in user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/mark-all-read
// @access  Private
router.put('/mark-all-read', protect, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error.message);
    res.status(500).json({ message: 'Server error marking notifications as read' });
  }
});

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    console.error('Error updating notification:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(500).json({ message: 'Server error updating notification' });
  }
});

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
router.delete('/clear-all', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error.message);
    res.status(500).json({ message: 'Server error clearing notifications' });
  }
});

module.exports = router;
