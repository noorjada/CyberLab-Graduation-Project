const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  type: {
    type: String,
    enum: ['challenge', 'lab', 'path', 'badge', 'event', 'certificate'],
    required: true
  },
  message: { type: String, required: true },
  icon: { type: String, default: '🎯' },
  link: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

activitySchema.index({ createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
