const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  courseCode: { type: String, default: '' },
  semester: { type: String, default: '' },
  inviteCode: { type: String, required: true, unique: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedPaths: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningPath' }],
  assignedLabs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lab' }],
  assignedCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Classroom', classroomSchema);
