const mongoose = require('mongoose');
const crypto = require('crypto');

const courseCertificateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' },
  courseTitle: { type: String, required: true },
  instructorName: { type: String, default: 'CyberLab Instructor' },
  certificateId: { type: String, unique: true, default: () => crypto.randomUUID() },
  finalExamScore: { type: Number, default: 0 },
  completedAt: { type: Date, default: Date.now }
});

courseCertificateSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('CourseCertificate', courseCertificateSchema);
