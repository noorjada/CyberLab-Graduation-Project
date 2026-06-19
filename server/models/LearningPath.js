const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  icon: { type: String, default: '📚' },
  order: { type: Number, required: true },
  topics: [String],
  challenges: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  xpReward: { type: Number, default: 100 },
  quiz: [{
    question: String,
    options: [String],
    correctIndex: Number
  }],
  passThreshold: { type: Number, default: 80 }
});

const learningPathSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  track: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  careerPath: {
    type: String,
    enum: ['pentester', 'soc', 'forensics', 'general'],
    default: 'general'
  },
  icon: { type: String, default: '🛡️' },
  color: { type: String, default: '#1f6feb' },
  order: { type: Number, required: true },
  modules: [moduleSchema],
  prerequisites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LearningPath'
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LearningPath', learningPathSchema);