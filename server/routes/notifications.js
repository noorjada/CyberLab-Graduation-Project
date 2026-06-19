const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { user: req.user.userId },
        { user: null }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    const unreadCount = notifications.filter(n => !n.read).length;

    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ user: req.user.userId }, { user: null }]
      },
      { read: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all as read
router.put('/read/all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      {
        $or: [{ user: req.user.userId }, { user: null }],
        read: false
      },
      { read: true }
    );
    res.json({ message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create announcement (admin only)
router.post('/announce', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { title, message, icon, link } = req.body;

    const notification = new Notification({
      user: null,
      title,
      message,
      type: 'announcement',
      icon: icon || '📢',
      link: link || ''
    });

    await notification.save();
    res.status(201).json({ message: 'Announcement sent!', notification });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;