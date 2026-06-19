const mongoose = require('mongoose');
const { theoryLessonSchema } = require('./theoryLessonSchema');

const labSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['web', 'network', 'linux', 'forensics', 'crypto'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    required: true
  },
  points: { type: Number, required: true },
  dockerImage: { type: String, required: true },
  flag: { type: String, required: true },
  flags: [{
    key: { type: String, required: true },
    label: { type: String, required: true },
    flag: { type: String, required: true },
    points: { type: Number, default: 0 },
    order: { type: Number, default: 0 }
  }],
  hints: [String],
  hintCosts: { type: [Number], default: [0, 15, 30] },
  walkthrough: {
    content: { type: String, default: '' },
    steps: [String],
    tools: [String],
    author: { type: String, default: 'CyberLab Team' }
  },
  learningObjectives: [{ type: String }],
  theoryLesson: { type: theoryLessonSchema, default: () => ({ enabled: true }) },
  tasks: [{
    title: { type: String },
    description: { type: String },
    hint: { type: String },
    points: { type: Number, default: 0 }
  }],
  tools: [String],
  estimatedTime: { type: Number, default: 30 },
  mitreTags: [String],
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  slug: { type: String, trim: true },
  buildStatus: {
    type: String,
    enum: ['draft', 'building', 'ready', 'failed'],
    default: 'ready'
  },
  buildError: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  completedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: { type: Date, default: Date.now }
});

labSchema.index({ slug: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Lab', labSchema);