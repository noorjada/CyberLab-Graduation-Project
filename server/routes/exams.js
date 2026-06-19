const express = require('express');
const Exam = require('../models/Exam');
const ExamAttempt = require('../models/ExamAttempt');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { gradeExam, publicQuestions } = require('../utils/examGrading');
const { updateLevel } = require('../utils/progression');
const { logActivity } = require('../utils/activity');
const { recordDailyActive } = require('../utils/recordDailyActive');
const {
  getActiveExamSession,
  startExamSession,
  clearExamSession,
  recordFocusWarning
} = require('../utils/examSession');

const router = express.Router();

const attachUserStats = async (exams, userId) => {
  const examIds = exams.map(e => e._id);
  const attempts = await ExamAttempt.find({ user: userId, exam: { $in: examIds } })
    .sort({ submittedAt: -1 });

  const statsMap = {};
  attempts.forEach(a => {
    const id = a.exam.toString();
    if (!statsMap[id]) {
      statsMap[id] = {
        bestScore: a.score,
        passed: a.passed,
        attemptCount: 1,
        lastAttemptAt: a.submittedAt
      };
    } else {
      statsMap[id].attemptCount++;
      if (a.score > statsMap[id].bestScore) statsMap[id].bestScore = a.score;
      if (a.passed) statsMap[id].passed = true;
    }
  });

  return exams.map(exam => {
    const obj = exam.toObject ? exam.toObject() : exam;
    const stats = statsMap[obj._id.toString()] || {
      bestScore: null,
      passed: false,
      attemptCount: 0,
      lastAttemptAt: null
    };
    return {
      _id: obj._id,
      slug: obj.slug,
      title: obj.title,
      description: obj.description,
      icon: obj.icon,
      category: obj.category,
      difficulty: obj.difficulty,
      durationMinutes: obj.durationMinutes,
      passThreshold: obj.passThreshold,
      questionCount: obj.questions?.length || 0,
      pointsReward: obj.pointsReward,
      xpReward: obj.xpReward,
      ...stats
    };
  });
};

router.get('/', auth, async (req, res) => {
  try {
    const exams = await Exam.find({ isActive: true }).sort({ order: 1 });
    const withStats = await attachUserStats(exams, req.user.userId);
    res.json(withStats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/session/active', auth, async (req, res) => {
  try {
    const session = await getActiveExamSession(req.user.userId);
    res.json({ active: !!session, session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/session/focus-warning', auth, async (req, res) => {
  try {
    const session = await getActiveExamSession(req.user.userId);
    if (!session) {
      return res.status(400).json({ message: 'No active exam session' });
    }
    const count = await recordFocusWarning(req.user.userId);
    res.json({ focusWarnings: count });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/attempts/my', auth, async (req, res) => {
  try {
    const attempts = await ExamAttempt.find({ user: req.user.userId })
      .populate('exam', 'title icon slug category passThreshold')
      .sort({ submittedAt: -1 })
      .limit(50);

    res.json(attempts.map(a => ({
      _id: a._id,
      exam: a.exam,
      score: a.score,
      correctCount: a.correctCount,
      totalQuestions: a.totalQuestions,
      passed: a.passed,
      timeSpentSeconds: a.timeSpentSeconds,
      submittedAt: a.submittedAt
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/attempts/:attemptId', auth, async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.attemptId)
      .populate('exam', 'title icon slug passThreshold pointsReward');

    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });
    if (attempt.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(attempt);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/start', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isActive) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const existing = await getActiveExamSession(req.user.userId);
    if (existing) {
      if (existing.examId === exam._id.toString()) {
        return res.json({
          message: 'Resuming your active exam session.',
          resumed: true,
          exam: {
            _id: exam._id,
            slug: exam.slug,
            title: exam.title,
            icon: exam.icon,
            durationMinutes: exam.durationMinutes,
            passThreshold: exam.passThreshold,
            questionCount: exam.questions.length
          },
          session: {
            startedAt: existing.startedAt,
            expiresAt: existing.expiresAt,
            focusWarnings: existing.focusWarnings
          }
        });
      }
      return res.status(409).json({
        message: 'Finish or exit your current exam before starting another.',
        code: 'EXAM_ALREADY_ACTIVE',
        session: existing
      });
    }

    const session = await startExamSession(req.user.userId, exam);

    res.json({
      message: 'Exam session started — AI assistance is disabled until you submit or exit.',
      exam: {
        _id: exam._id,
        slug: exam.slug,
        title: exam.title,
        icon: exam.icon,
        durationMinutes: exam.durationMinutes,
        passThreshold: exam.passThreshold,
        questionCount: exam.questions.length
      },
      session
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to start exam session' });
  }
});

router.post('/:id/abandon', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('activeExamSession');
    const activeId = user?.activeExamSession?.exam?.toString();
    if (!activeId || activeId !== req.params.id) {
      await clearExamSession(req.user.userId);
      return res.json({ message: 'No matching session — cleared' });
    }

    await clearExamSession(req.user.userId);
    res.json({ message: 'Exam session ended' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isActive) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const previousAttempts = await ExamAttempt.countDocuments({
      user: req.user.userId,
      exam: exam._id
    });

    res.json({
      _id: exam._id,
      slug: exam.slug,
      title: exam.title,
      description: exam.description,
      icon: exam.icon,
      category: exam.category,
      difficulty: exam.difficulty,
      durationMinutes: exam.durationMinutes,
      passThreshold: exam.passThreshold,
      pointsReward: exam.pointsReward,
      xpReward: exam.xpReward,
      questionCount: exam.questions.length,
      questions: publicQuestions(exam.questions),
      attemptCount: previousAttempts
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/submit', auth, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam || !exam.isActive) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const { answers, timeSpentSeconds } = req.body;
    if (!Array.isArray(answers)) {
      return res.status(400).json({ message: 'Answers array required' });
    }

    const graded = gradeExam(exam, answers, timeSpentSeconds || 0);

    const attempt = await ExamAttempt.create({
      user: req.user.userId,
      exam: exam._id,
      answers,
      ...graded
    });

    const user = await User.findById(req.user.userId);
    const hadPreviousPass = await ExamAttempt.findOne({
      user: req.user.userId,
      exam: exam._id,
      passed: true,
      _id: { $ne: attempt._id }
    });

    let pointsEarned = 0;
    let xpEarned = 0;

    if (graded.passed && !hadPreviousPass) {
      pointsEarned = exam.pointsReward || 0;
      xpEarned = exam.xpReward || 0;
      user.points += pointsEarned;
      user.xp += xpEarned;
      updateLevel(user);

      await Notification.create({
        user: user._id,
        title: '🎓 Exam Passed!',
        message: `You passed "${exam.title}" with ${graded.score}%! +${pointsEarned} points`,
        type: 'badge',
        icon: exam.icon || '📝',
        link: '/exams'
      });
    }

    await clearExamSession(req.user.userId);
    await user.save();
    recordDailyActive(user._id);

    await logActivity(
      user,
      'badge',
      `${graded.passed ? 'passed' : 'attempted'} exam "${exam.title}" (${graded.score}%)`,
      graded.passed ? '🎓' : '📝',
      '/exams'
    );

    res.json({
      attemptId: attempt._id,
      ...graded,
      passThreshold: exam.passThreshold,
      pointsEarned,
      xpEarned,
      firstPass: graded.passed && !hadPreviousPass,
      totalPoints: user.points
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Grading failed' });
  }
});

module.exports = router;
