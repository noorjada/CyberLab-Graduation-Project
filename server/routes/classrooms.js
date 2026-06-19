const express = require('express');
const crypto = require('crypto');
const Classroom = require('../models/Classroom');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const auth = require('../middleware/auth');
const { canManageClassroom, canAccessClassroom } = require('../utils/classroomAccess');
const { enrollStudentInCourse } = require('../utils/courseAccess');
const { getClassroomAttendanceSummary } = require('../utils/attendance');

const router = express.Router();

router.get('/mine', auth, async (req, res) => {
  try {
    const asInstructor = await Classroom.find({ instructor: req.user.userId, isActive: true })
      .populate('students', 'username points xp level')
      .populate('assignedPaths', 'title icon')
      .populate('assignedLabs', 'title category')
      .populate('department', 'name code');

    const user = await User.findById(req.user.userId).populate({
      path: 'classrooms',
      match: { isActive: true },
      populate: [
        { path: 'instructor', select: 'username' },
        { path: 'department', select: 'name code' }
      ]
    });

    res.json({
      teaching: asInstructor,
      enrolled: user.classrooms || []
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Instructor access required' });
    }
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const classroom = await Classroom.create({
      name: req.body.name,
      description: req.body.description || '',
      courseCode: req.body.courseCode || '',
      semester: req.body.semester || '',
      department: req.body.departmentId || undefined,
      inviteCode,
      instructor: req.user.userId,
      assignedPaths: req.body.assignedPaths || [],
      assignedLabs: req.body.assignedLabs || []
    });

    if (req.body.departmentId) {
      await User.findByIdAndUpdate(req.user.userId, { department: req.body.departmentId });
    }

    res.status(201).json({ message: 'Classroom created', classroom });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const allowed = await canManageClassroom(req.params.id, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        courseCode: req.body.courseCode,
        semester: req.body.semester,
        assignedPaths: req.body.assignedPaths,
        assignedLabs: req.body.assignedLabs,
        department: req.body.departmentId
      },
      { new: true }
    );
    res.json({ message: 'Classroom updated', classroom });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const classroom = await Classroom.findOne({ inviteCode: inviteCode?.toUpperCase(), isActive: true });
    if (!classroom) return res.status(404).json({ message: 'Invalid invite code' });

    if (!classroom.students.includes(req.user.userId)) {
      classroom.students.push(req.user.userId);
      await classroom.save();
      const update = { $addToSet: { classrooms: classroom._id } };
      if (classroom.department) update.department = classroom.department;
      await User.findByIdAndUpdate(req.user.userId, update);

      const existingAssignments = await Assignment.find({ classroom: classroom._id });
      for (const a of existingAssignments) {
        await AssignmentSubmission.findOneAndUpdate(
          { assignment: a._id, student: req.user.userId },
          { assignment: a._id, student: req.user.userId, classroom: classroom._id, maxGrade: a.maxScore, status: 'pending' },
          { upsert: true }
        );
      }
      for (const courseId of classroom.assignedCourses || []) {
        await enrollStudentInCourse(req.user.userId, courseId, classroom._id);
      }
    }
    res.json({ message: `Joined ${classroom.name}`, classroom });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/dashboard', auth, async (req, res) => {
  try {
    const allowed = await canAccessClassroom(req.params.id, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const classroom = await Classroom.findById(req.params.id)
      .populate('instructor', 'username')
      .populate('department', 'name code')
      .populate('students', 'username points xp solvedChallenges completedLabs')
      .populate('assignedLabs', 'title');

    const isInstructor = await canManageClassroom(req.params.id, req.user.userId, req.user.role);

    const Course = require('../models/Course');
    const CourseProgress = require('../models/CourseProgress');
    const { attachModuleProgress } = require('../utils/courseAccess');

    const [assignments, attendance, courses] = await Promise.all([
      Assignment.find({ classroom: req.params.id }).sort({ dueDate: 1 }),
      getClassroomAttendanceSummary(req.params.id),
      Course.find({
        _id: { $in: classroom.assignedCourses || [] },
        ...(isInstructor ? {} : { isPublished: true })
      }).populate('instructor', 'username')
    ]);

    const coursesWithProgress = await Promise.all(courses.map(async (course) => {
      const progress = await CourseProgress.findOne({ user: req.user.userId, course: course._id });
      return {
        ...course.toObject(),
        ...attachModuleProgress(course, progress)
      };
    }));

    res.json({
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        courseCode: classroom.courseCode,
        semester: classroom.semester,
        description: classroom.description,
        inviteCode: isInstructor ? classroom.inviteCode : undefined,
        instructor: classroom.instructor,
        department: classroom.department,
        assignedLabs: classroom.assignedLabs,
        studentCount: classroom.students.length
      },
      assignments,
      attendance,
      courses: coursesWithProgress,
      students: isInstructor ? classroom.students.map(s => ({
        _id: s._id,
        username: s.username,
        points: s.points,
        xp: s.xp,
        solves: s.solvedChallenges?.length || 0,
        labs: s.completedLabs || 0
      })) : undefined,
      role: isInstructor ? 'instructor' : 'student'
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/progress', auth, async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate('students', 'username points xp solvedChallenges completedLabs completedModules');
    if (!classroom) return res.status(404).json({ message: 'Not found' });

    const allowed = await canAccessClassroom(req.params.id, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const attendance = await getClassroomAttendanceSummary(req.params.id);

    res.json({
      classroom: { name: classroom.name, students: classroom.students.length },
      progress: classroom.students.map(s => ({
        username: s.username,
        points: s.points,
        xp: s.xp,
        solves: s.solvedChallenges?.length || 0,
        labs: s.completedLabs || 0,
        modules: s.completedModules?.length || 0
      })),
      attendance: attendance?.students || []
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
