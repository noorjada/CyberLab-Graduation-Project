const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'graded', 'late'],
    default: 'pending'
  },
  autoScore: { type: Number, default: 0 },
  grade: { type: Number },
  maxGrade: { type: Number, default: 100 },
  feedback: { type: String, default: '' },
  labsCompleted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }],
  challengesCompleted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' }],
  completionPercent: { type: Number, default: 0 },
  submittedAt: { type: Date },
  gradedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gradedAt: { type: Date }
}, { timestamps: true });

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);
