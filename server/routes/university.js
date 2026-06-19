const express = require('express');
const Department = require('../models/Department');
const Classroom = require('../models/Classroom');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { canManageDepartment } = require('../utils/classroomAccess');
const { getClassroomAttendanceSummary, getWeekKey } = require('../utils/attendance');

const router = express.Router();

const requireStaff = (req, res, next) => {
  if (!['admin', 'instructor'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Staff access required' });
  }
  next();
};

router.get('/departments', auth, async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/departments', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }
    const dept = await Department.create({
      name: req.body.name,
      code: req.body.code?.toUpperCase(),
      description: req.body.description || '',
      admins: req.body.admins || [req.user.userId]
    });
    res.status(201).json({ message: 'Department created', department: dept });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/departments/:id/stats', auth, async (req, res) => {
  try {
    const allowed = await canManageDepartment(req.params.id, req.user.userId, req.user.role);
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    if (!allowed && req.user.role !== 'instructor') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const classrooms = await Classroom.find({
      department: dept._id,
      isActive: true
    }).populate('instructor', 'username').populate('students', 'username');

    const classroomIds = classrooms.map(c => c._id);
    const [assignments, submissions, attendance] = await Promise.all([
      Assignment.countDocuments({ classroom: { $in: classroomIds } }),
      AssignmentSubmission.find({ classroom: { $in: classroomIds } }),
      AttendanceRecord.find({ classroom: { $in: classroomIds } })
    ]);

    const totalStudents = new Set();
    classrooms.forEach(c => c.students.forEach(s => totalStudents.add(s._id.toString())));

    const graded = submissions.filter(s => s.status === 'graded' || s.grade != null);
    const avgGrade = graded.length
      ? Math.round(graded.reduce((sum, s) => sum + (s.grade ?? s.autoScore), 0) / graded.length)
      : 0;

    const currentWeek = getWeekKey();
    const weekAttendance = attendance.filter(a => a.week === currentWeek);
    const activeThisWeek = new Set(weekAttendance
      .filter(a => a.labSessions > 0 || a.participationDays?.length > 0)
      .map(a => a.user.toString())
    ).size;

    res.json({
      department: { _id: dept._id, name: dept.name, code: dept.code },
      overview: {
        classrooms: classrooms.length,
        instructors: new Set(classrooms.map(c => c.instructor._id.toString())).size,
        students: totalStudents.size,
        assignments,
        submissions: submissions.length,
        avgGrade,
        activeStudentsThisWeek: activeThisWeek
      },
      classrooms: classrooms.map(c => ({
        _id: c._id,
        name: c.name,
        courseCode: c.courseCode,
        semester: c.semester,
        instructor: c.instructor?.username,
        studentCount: c.students.length,
        inviteCode: c.inviteCode
      }))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard/instructor', auth, requireStaff, async (req, res) => {
  try {
    const classrooms = await Classroom.find({
      instructor: req.user.userId,
      isActive: true
    })
      .populate('students', 'username points xp')
      .populate('department', 'name code')
      .populate('assignedLabs', 'title');

    const classroomIds = classrooms.map(c => c._id);
    const assignments = await Assignment.find({
      classroom: { $in: classroomIds }
    }).sort({ dueDate: 1 });

    const submissions = await AssignmentSubmission.find({
      classroom: { $in: classroomIds }
    });

    const classSummaries = await Promise.all(
      classrooms.map(async (c) => {
        const attendance = await getClassroomAttendanceSummary(c._id);
        const classAssignments = assignments.filter(a => a.classroom.toString() === c._id.toString());
        const classSubs = submissions.filter(s => s.classroom.toString() === c._id.toString());
        const pendingGrade = classSubs.filter(s => s.status === 'submitted' && s.grade == null).length;

        return {
          _id: c._id,
          name: c.name,
          courseCode: c.courseCode,
          semester: c.semester,
          inviteCode: c.inviteCode,
          department: c.department,
          studentCount: c.students.length,
          assignmentCount: classAssignments.length,
          pendingGrading: pendingGrade,
          upcomingDue: classAssignments.filter(a => new Date(a.dueDate) > new Date()).length,
          attendance: attendance?.students?.slice(0, 5) || []
        };
      })
    );

    res.json({
      classrooms: classSummaries,
      totalStudents: classrooms.reduce((s, c) => s + c.students.length, 0),
      totalAssignments: assignments.length,
      overdueAssignments: assignments.filter(a => new Date(a.dueDate) < new Date()).length
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/dashboard/student', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: 'classrooms',
      populate: [
        { path: 'instructor', select: 'username' },
        { path: 'department', select: 'name code' }
      ]
    });

    const classroomIds = (user.classrooms || []).map(c => c._id);
    const [assignments, submissions, attendance] = await Promise.all([
      Assignment.find({
        classroom: { $in: classroomIds },
        published: true
      }).populate('classroom', 'name').sort({ dueDate: 1 }),
      AssignmentSubmission.find({ student: req.user.userId }),
      AttendanceRecord.find({ user: req.user.userId }).sort({ week: -1 }).limit(12)
    ]);

    const subMap = Object.fromEntries(submissions.map(s => [s.assignment.toString(), s]));

    const myAssignments = assignments.map(a => {
      const sub = subMap[a._id.toString()];
      const overdue = new Date(a.dueDate) < new Date() && !sub?.submittedAt;
      return {
        _id: a._id,
        title: a.title,
        classroom: a.classroom?.name,
        dueDate: a.dueDate,
        maxScore: a.maxScore,
        status: sub?.status || (overdue ? 'overdue' : 'pending'),
        grade: sub?.grade ?? sub?.autoScore,
        completionPercent: sub?.completionPercent || 0
      };
    });

    const currentWeek = getWeekKey();
    const thisWeek = attendance.filter(a => a.week === currentWeek);

    res.json({
      classrooms: user.classrooms || [],
      assignments: myAssignments,
      attendance: {
        currentWeek,
        labSessions: thisWeek.reduce((s, r) => s + r.labSessions, 0),
        participationDays: thisWeek.reduce((s, r) => s + (r.participationDays?.length || 0), 0),
        assignmentsCompleted: thisWeek.reduce((s, r) => s + (r.assignmentsCompleted?.length || 0), 0),
        weeklyHistory: attendance.map(r => ({
          week: r.week,
          labSessions: r.labSessions,
          participationDays: r.participationDays?.length || 0,
          assignmentsCompleted: r.assignmentsCompleted?.length || 0
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
