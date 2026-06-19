const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  dueDate: { type: Date, required: true },
  requiredLabs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }],
  requiredChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  maxScore: { type: Number, default: 100 },
  published: { type: Boolean, default: true },
  allowLate: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

assignmentSchema.index({ classroom: 1, dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
