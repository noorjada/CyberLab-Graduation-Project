const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means it's for all users
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['badge', 'streak', 'challenge', 'announcement', 'system'],
    default: 'system'
  },
  icon: { type: String, default: '🔔' },
  read: { type: Boolean, default: false },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);