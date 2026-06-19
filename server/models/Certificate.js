const mongoose = require('mongoose');
const crypto   = require('crypto');

const certificateSchema = new mongoose.Schema({
  user:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learningPath:  { type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath', required: true },
  pathTitle:     { type: String, required: true },
  pathTrack:     { type: String, required: true },
  pathCareerPath:{ type: String, default: 'general' },
  pathIcon:      { type: String, default: '🛡️' },
  certificateId: { type: String, unique: true, default: () => crypto.randomUUID() },
  completedAt:   { type: Date, default: Date.now },
  xpEarned:      { type: Number, default: 0 },
  totalModules:  { type: Number, default: 0 }
});

module.exports = mongoose.model('Certificate', certificateSchema);
