const AttendanceRecord = require('../models/AttendanceRecord');
const Classroom = require('../models/Classroom');
const User = require('../models/User');

const getWeekKey = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
};

const getDayKey = (date = new Date()) => date.toISOString().slice(0, 10);

const getOrCreateRecord = async (userId, classroomId, week) => {
  let record = await AttendanceRecord.findOne({ user: userId, classroom: classroomId, week });
  if (!record) {
    record = await AttendanceRecord.create({ user: userId, classroom: classroomId, week });
  }
  return record;
};

const getUserClassrooms = async (userId) => {
  const user = await User.findById(userId).select('classrooms');
  return user?.classrooms || [];
};

const recordLabAttendance = async (userId, labId) => {
  try {
    const Assignment = require('../models/Assignment');
    const assignmentClassIds = await Assignment.distinct('classroom', { requiredLabs: labId });

    const classrooms = await Classroom.find({
      students: userId,
      isActive: true,
      $or: [
        { assignedLabs: labId },
        { _id: { $in: assignmentClassIds } }
      ]
    }).select('_id');

    const week = getWeekKey();
    for (const classroom of classrooms) {
      const record = await getOrCreateRecord(userId, classroom._id, week);
      record.labSessions += 1;
      record.lastActivityAt = new Date();
      await record.save();
    }
  } catch (err) {
    console.error('Lab attendance record failed:', err.message);
  }
};

const recordParticipation = async (userId) => {
  try {
    const classroomIds = await getUserClassrooms(userId);
    if (!classroomIds.length) return;

    const week = getWeekKey();
    const day = getDayKey();

    for (const classroomId of classroomIds) {
      const record = await getOrCreateRecord(userId, classroomId, week);
      if (!record.participationDays.includes(day)) {
        record.participationDays.push(day);
        record.lastActivityAt = new Date();
        await record.save();
      }
    }
  } catch (err) {
    console.error('Participation record failed:', err.message);
  }
};

const recordAssignmentCompletion = async (userId, classroomId, assignmentId) => {
  try {
    const record = await getOrCreateRecord(userId, classroomId, getWeekKey());
    const id = assignmentId.toString();
    if (!record.assignmentsCompleted.some(a => a.toString() === id)) {
      record.assignmentsCompleted.push(assignmentId);
      record.lastActivityAt = new Date();
      await record.save();
    }
  } catch (err) {
    console.error('Assignment attendance record failed:', err.message);
  }
};

const getClassroomAttendanceSummary = async (classroomId, weeks = 8) => {
  const classroom = await Classroom.findById(classroomId).populate('students', 'username');
  if (!classroom) return null;

  const records = await AttendanceRecord.find({ classroom: classroomId })
    .sort({ week: -1 })
    .limit(weeks * (classroom.students?.length || 1));

  const byStudent = {};
  classroom.students.forEach(s => {
    byStudent[s._id.toString()] = {
      userId: s._id,
      username: s.username,
      totalLabSessions: 0,
      totalParticipationDays: 0,
      assignmentsCompleted: 0,
      weeksActive: 0
    };
  });

  const weeksSeen = new Set();
  records.forEach(r => {
    const key = r.user.toString();
    if (!byStudent[key]) return;
    byStudent[key].totalLabSessions += r.labSessions;
    byStudent[key].totalParticipationDays += r.participationDays?.length || 0;
    byStudent[key].assignmentsCompleted += r.assignmentsCompleted?.length || 0;
    if (r.labSessions > 0 || r.participationDays?.length > 0) {
      byStudent[key].weeksActive += 1;
    }
    weeksSeen.add(r.week);
  });

  const weekCount = Math.max(weeksSeen.size, 1);

  return {
    students: Object.values(byStudent).map(s => ({
      ...s,
      weeklyParticipation: Math.round((s.totalParticipationDays / weekCount) * 10) / 10,
      labAttendanceRate: Math.min(100, Math.round((s.totalLabSessions / weekCount) * 25))
    })),
    weeksTracked: weekCount
  };
};

module.exports = {
  getWeekKey,
  getDayKey,
  recordLabAttendance,
  recordParticipation,
  recordAssignmentCompletion,
  getClassroomAttendanceSummary
};
