const express = require('express');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Classroom = require('../models/Classroom');
const Lab = require('../models/Lab');
const Challenge = require('../models/Challenge');
const auth = require('../middleware/auth');
const { canManageClassroom, canAccessClassroom } = require('../utils/classroomAccess');
const { gradeSubmission, isLate } = require('../utils/assignmentGrading');
const { recordAssignmentCompletion } = require('../utils/attendance');

const router = express.Router();

router.get('/options/labs-challenges', auth, async (req, res) => {
  try {
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Staff only' });
    }
    const [labs, challenges] = await Promise.all([
      Lab.find({ isActive: true }).select('title category difficulty'),
      Challenge.find().select('title category difficulty')
    ]);
    res.json({ labs, challenges });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/classroom/:classroomId', auth, async (req, res) => {
  try {
    const allowed = await canAccessClassroom(req.params.classroomId, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const assignments = await Assignment.find({ classroom: req.params.classroomId })
      .populate('requiredLabs', 'title category')
      .populate('requiredChallenges', 'title category')
      .sort({ dueDate: 1 });

    const isInstructor = await canManageClassroom(req.params.classroomId, req.user.userId, req.user.role);

    if (isInstructor) {
      const subs = await AssignmentSubmission.find({ classroom: req.params.classroomId })
        .populate('student', 'username');
      return res.json({
        assignments,
        submissions: subs.map(s => ({
          _id: s._id,
          assignment: s.assignment,
          student: s.student,
          status: s.status,
          grade: s.grade,
          autoScore: s.autoScore,
          completionPercent: s.completionPercent,
          submittedAt: s.submittedAt
        }))
      });
    }

    const subs = await AssignmentSubmission.find({
      classroom: req.params.classroomId,
      student: req.user.userId
    });
    const subMap = Object.fromEntries(subs.map(s => [s.assignment.toString(), s]));

    res.json({
      assignments: assignments.filter(a => a.published).map(a => ({
        ...a.toObject(),
        mySubmission: subMap[a._id.toString()] || null
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { classroomId, title, description, dueDate, requiredLabs, requiredChallenges, maxScore, allowLate } = req.body;
    const allowed = await canManageClassroom(classroomId, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const assignment = await Assignment.create({
      classroom: classroomId,
      instructor: req.user.userId,
      title,
      description: description || '',
      dueDate: new Date(dueDate),
      requiredLabs: requiredLabs || [],
      requiredChallenges: requiredChallenges || [],
      maxScore: maxScore || 100,
      allowLate: allowLate !== false
    });

    const classroom = await Classroom.findById(classroomId);
    for (const studentId of classroom.students) {
      await AssignmentSubmission.findOneAndUpdate(
        { assignment: assignment._id, student: studentId },
        {
          assignment: assignment._id,
          student: studentId,
          classroom: classroomId,
          maxGrade: assignment.maxScore,
          status: 'pending'
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ message: 'Assignment created', assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Not found' });

    const allowed = await canManageClassroom(assignment.classroom, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    const fields = ['title', 'description', 'dueDate', 'requiredLabs', 'requiredChallenges', 'maxScore', 'published', 'allowLate'];
    fields.forEach(f => {
      if (req.body[f] !== undefined) assignment[f] = req.body[f];
    });
    if (req.body.dueDate) assignment.dueDate = new Date(req.body.dueDate);

    await assignment.save();
    res.json({ message: 'Assignment updated', assignment });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Not found' });

    const allowed = await canManageClassroom(assignment.classroom, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    await AssignmentSubmission.deleteMany({ assignment: assignment._id });
    await Assignment.findByIdAndDelete(assignment._id);
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/submit', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('requiredLabs', 'title')
      .populate('requiredChallenges', 'title');

    if (!assignment || !assignment.published) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const classroom = await Classroom.findById(assignment.classroom);
    if (!classroom.students.some(s => s.toString() === req.user.userId)) {
      return res.status(403).json({ message: 'Not enrolled in this class' });
    }

    const late = isLate(assignment);
    if (late && !assignment.allowLate) {
      return res.status(400).json({ message: 'Past due date — late submissions not allowed' });
    }

    const graded = await gradeSubmission(assignment, req.user.userId);

    const submission = await AssignmentSubmission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user.userId },
      {
        assignment: assignment._id,
        student: req.user.userId,
        classroom: assignment.classroom,
        status: late ? 'late' : 'submitted',
        autoScore: graded.autoScore,
        grade: graded.autoScore,
        maxGrade: graded.maxGrade,
        labsCompleted: graded.labsCompleted,
        challengesCompleted: graded.challengesCompleted,
        completionPercent: graded.completionPercent,
        submittedAt: new Date()
      },
      { upsert: true, new: true }
    );

    if (graded.fullyComplete) {
      await recordAssignmentCompletion(req.user.userId, assignment.classroom, assignment._id);
    }

    res.json({
      message: 'Assignment submitted and auto-graded',
      submission: {
        status: submission.status,
        autoScore: submission.autoScore,
        grade: submission.grade,
        completionPercent: submission.completionPercent,
        labsCompleted: graded.labsCompleted.length,
        labsRequired: assignment.requiredLabs.length,
        challengesCompleted: graded.challengesCompleted.length,
        challengesRequired: assignment.requiredChallenges.length,
        breakdown: {
          labs: assignment.requiredLabs.map(l => ({
            id: l._id,
            title: l.title,
            completed: graded.labsCompleted.includes(l._id.toString())
          })),
          challenges: assignment.requiredChallenges.map(c => ({
            id: c._id,
            title: c.title,
            completed: graded.challengesCompleted.includes(c._id.toString())
          }))
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Submit failed' });
  }
});

router.put('/submissions/:submissionId/grade', auth, async (req, res) => {
  try {
    const submission = await AssignmentSubmission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ message: 'Not found' });

    const allowed = await canManageClassroom(submission.classroom, req.user.userId, req.user.role);
    if (!allowed) return res.status(403).json({ message: 'Access denied' });

    if (req.body.grade != null) submission.grade = req.body.grade;
    if (req.body.feedback != null) submission.feedback = req.body.feedback;
    submission.status = 'graded';
    submission.gradedBy = req.user.userId;
    submission.gradedAt = new Date();

    await submission.save();
    res.json({ message: 'Grade saved', submission });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
