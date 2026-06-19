const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  challenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  labs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }],
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    points: { type: Number, default: 0 },
    solvedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
    completedLabs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }],
    joinedAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
