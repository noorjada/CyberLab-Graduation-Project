const mongoose = require('mongoose');

const learningNoteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['note', 'command', 'writeup', 'summary'],
    default: 'note'
  },
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  linkType: {
    type: String,
    enum: ['challenge', 'lab', 'general'],
    default: 'general'
  },
  linkId: { type: mongoose.Schema.Types.ObjectId },
  linkTitle: { type: String, default: '' },
  tags: [String],
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

learningNoteSchema.index({ user: 1, createdAt: -1 });
learningNoteSchema.index({ user: 1, linkType: 1, linkId: 1 });
learningNoteSchema.index({ user: 1, type: 1 });

learningNoteSchema.pre('save', function updateTimestamp(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('LearningNote', learningNoteSchema);
