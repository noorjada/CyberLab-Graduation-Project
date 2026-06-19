const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  answers: [{ type: Number }],
  score: { type: Number, required: true },
  correctCount: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  passed: { type: Boolean, required: true },
  timeSpentSeconds: { type: Number, default: 0 },
  results: [{
    questionIndex: Number,
    question: String,
    selectedIndex: Number,
    correctIndex: Number,
    correct: Boolean,
    explanation: String,
    topic: String
  }],
  submittedAt: { type: Date, default: Date.now }
});

examAttemptSchema.index({ user: 1, exam: 1, submittedAt: -1 });

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
