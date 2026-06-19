const mongoose = require('mongoose');

const moduleScoreSchema = new mongoose.Schema({
  moduleId: { type: String, required: true },
  score: { type: Number, default: 0 },
  passed: { type: Boolean, default: false },
  completedAt: { type: Date, default: Date.now }
}, { _id: false });

const courseProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  completedModuleIds: [{ type: String }],
  moduleScores: [moduleScoreSchema],
  enrolledAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  certificateId: { type: String, default: '' }
});

courseProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('CourseProgress', courseProgressSchema);
