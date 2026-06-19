const mongoose = require('mongoose');

const theoryBlockSchema = new mongoose.Schema({
  content: { type: String, default: '' },
  bullets: [{ type: String }],
  code: { type: String, default: '' }
}, { _id: false });

const dragItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true }
}, { _id: false });

const videoLessonSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['youtube', 'instructor', 'walkthrough'], default: 'youtube' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  youtubeId: { type: String, required: true },
  duration: { type: String, default: '' },
  instructor: { type: String, default: 'CyberLab' }
}, { _id: false });

const interactiveExerciseSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['mcq', 'fill', 'drag', 'mini'], required: true },
  question: { type: String, required: true },
  options: [{ type: String }],
  correctIndex: { type: Number },
  answer: { type: String },
  acceptable: [{ type: String }],
  items: [dragItemSchema],
  correctOrder: [{ type: String }],
  explanation: { type: String, default: '' }
}, { _id: false });

const theoryLessonSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  interactiveMode: { type: Boolean, default: true },
  interactives: [interactiveExerciseSchema],
  videos: [videoLessonSchema],
  theory: { type: theoryBlockSchema, default: () => ({}) },
  example: { type: theoryBlockSchema, default: () => ({}) },
  commonMistakes: { type: theoryBlockSchema, default: () => ({}) },
  defense: { type: theoryBlockSchema, default: () => ({}) },
  labGoal: { type: theoryBlockSchema, default: () => ({}) }
}, { _id: false });

module.exports = { theoryLessonSchema, theoryBlockSchema };
