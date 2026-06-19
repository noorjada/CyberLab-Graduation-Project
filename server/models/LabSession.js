const mongoose = require('mongoose');

const labSessionSchema = new mongoose.Schema({
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
  containerId: { type: String },
  containerPort: { type: Number },
  status: {
    type: String,
    enum: ['starting', 'running', 'stopped', 'error'],
    default: 'starting'
  },
  startedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date },
  completedAt: { type: Date },
  flagSubmitted: { type: Boolean, default: false },
  solvedFlagKeys: [{ type: String }],
  resetCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('LabSession', labSessionSchema);