const mongoose = require('mongoose');
const { theoryLessonSchema } = require('./theoryLessonSchema');

const challengeSchema = new mongoose.Schema({
  slug: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['web', 'network', 'linux', 'forensics'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  flag: {
    type: String,
    required: true
  },
  hints: [String],
  hintCosts: { type: [Number], default: [0, 10, 25] },
  mitreTags: [String],
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  solvedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  writeup: {
    content: { type: String, default: '' },
    steps: [String],
    tools: [String],
    author: { type: String, default: 'CyberLab Team' }
  },
  learningObjectives: [{ type: String }],
  theoryLesson: { type: theoryLessonSchema, default: () => ({ enabled: true }) },
  files: [{
    originalName: { type: String, required: true },
    storedName: { type: String, required: true },
    mimeType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Challenge', challengeSchema);