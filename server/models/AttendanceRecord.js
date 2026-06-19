const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  classroom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  week: { type: String, required: true },
  labSessions: { type: Number, default: 0 },
  participationDays: [{ type: String }],
  assignmentsCompleted: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Assignment' }],
  lastActivityAt: { type: Date, default: Date.now }
}, { timestamps: true });

attendanceRecordSchema.index({ user: 1, classroom: 1, week: 1 }, { unique: true });
attendanceRecordSchema.index({ classroom: 1, week: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
