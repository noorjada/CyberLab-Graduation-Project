const mongoose = require('mongoose');

const planLinkSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      'challenge', 'lab', 'labs', 'reference', 'roadmap', 'soc', 'exams',
      'exploits', 'notes', 'terminal', 'virustotal', 'certificates', 'course', 'external'
    ],
    default: 'external'
  },
  label: { type: String, required: true },
  path: { type: String, default: '' },
  resourceTitle: { type: String, default: '' },
  resourceSlug: { type: String, default: '' }
}, { _id: false, id: false });

const planTopicSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  day: { type: Number },
  week: { type: Number },
  objectives: [{ type: String }],
  frameworks: [{ type: String }],
  estimatedHours: { type: Number, default: 3 },
  links: [planLinkSchema]
}, { _id: false, id: false });

const planPhaseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  order: { type: Number, required: true },
  topics: [planTopicSchema]
}, { _id: false, id: false });

const studyPlanSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, trim: true },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  description: { type: String, required: true },
  career: {
    type: String,
    enum: ['pentester', 'soc', 'forensics', 'general'],
    default: 'general'
  },
  duration: { type: String, default: '30 days' },
  durationDays: { type: Number, default: 30 },
  icon: { type: String, default: '📅' },
  color: { type: String, default: '#1f6feb' },
  featured: { type: Boolean, default: false },
  outcomes: [{ type: String }],
  phases: [planPhaseSchema],
  order: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true }
});

module.exports = mongoose.model('StudyPlan', studyPlanSchema);
