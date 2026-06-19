const Activity = require('../models/Activity');

async function logActivity(user, type, message, icon = '🎯', link = '') {
  try {
    await Activity.create({
      user: user._id || user.userId,
      username: user.username,
      type,
      message,
      icon,
      link
    });
  } catch (err) {
    console.error('Activity log failed:', err.message);
  }
}

module.exports = { logActivity };
