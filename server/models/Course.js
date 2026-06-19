const mongoose = require('mongoose');

const courseQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: '' }
}, { _id: false });

const courseModuleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['lesson', 'quiz', 'lab', 'exam', 'certificate'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  lessonContent: { type: String, default: '' },
  lessonBullets: [{ type: String }],
  videoYoutubeId: { type: String, default: '' },
  questions: [courseQuestionSchema],
  passThreshold: { type: Number, default: 70 },
  lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
  estimatedMinutes: { type: Number, default: 30 }
}, { _id: false });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  category: {
    type: String,
    enum: ['web', 'network', 'linux', 'forensics', 'soc', 'general'],
    default: 'general'
  },
  icon: { type: String, default: '📘' },
  color: { type: String, default: '#1f6feb' },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  modules: [courseModuleSchema],
  isPublished: { type: Boolean, default: false },
  certificateTitle: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

courseSchema.pre('save', function () {
  this.updatedAt = new Date();
  if (!this.certificateTitle) this.certificateTitle = this.title;
});

module.exports = mongoose.model('Course', courseSchema);
