const mongoose = require('mongoose');

const examQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  topic: { type: String, default: 'General' },
  explanation: { type: String, default: '' }
});

const examSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '📝' },
  category: {
    type: String,
    enum: ['beginner', 'web', 'linux', 'incident-response'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  durationMinutes: { type: Number, default: 45 },
  passThreshold: { type: Number, default: 70 },
  pointsReward: { type: Number, default: 100 },
  xpReward: { type: Number, default: 150 },
  questions: [examQuestionSchema],
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
