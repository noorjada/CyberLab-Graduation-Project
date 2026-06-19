const mongoose = require('mongoose');

const resourceLinkSchema = new mongoose.Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  type: {
    type: String,
    enum: ['website', 'tool', 'library', 'book', 'cert', 'standard', 'course', 'repo'],
    default: 'website'
  }
}, { _id: false });

const sectionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, default: '' },
  bullets: [{ type: String }],
  links: [resourceLinkSchema]
}, { _id: false });

const toolSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  url: { type: String, default: '' },
  category: { type: String, default: 'general' }
}, { _id: false });

const referenceArticleSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  icon: { type: String, default: '📚' },
  category: {
    type: String,
    enum: [
      'roles', 'ethical-hacking', 'pentesting', 'forensics',
      'blue-team', 'governance', 'fundamentals', 'tools',
      'resources', 'certifications'
    ],
    required: true
  },
  subcategory: { type: String, default: '' },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  readingMinutes: { type: Number, default: 10 },
  tags: [{ type: String }],
  sections: [sectionSchema],
  tools: [toolSchema],
  relatedSlugs: [{ type: String }],
  prerequisites: [{ type: String }],
  order: { type: Number, default: 0 },
  featured: { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

referenceArticleSchema.index({ category: 1, order: 1 });
referenceArticleSchema.index({ tags: 1 });
referenceArticleSchema.index({ title: 'text', summary: 'text', tags: 'text' });

module.exports = mongoose.model('ReferenceArticle', referenceArticleSchema);
