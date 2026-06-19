const mongoose = require('mongoose');

const labProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lab: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lab',
    required: true
  },
  solvedFlagKeys: [{ type: String }],
  completedTaskIndexes: { type: [Number], default: [] },
  hintsRevealed: { type: Number, default: 0 },
  pointsEarned: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  totalActiveSeconds: { type: Number, default: 0 },
  lastStartedAt: Date
}, { timestamps: true });

labProgressSchema.index({ user: 1, lab: 1 }, { unique: true });

module.exports = mongoose.model('LabProgress', labProgressSchema);
