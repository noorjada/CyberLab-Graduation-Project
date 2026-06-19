const express = require('express');
const StudyPlan = require('../models/StudyPlan');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

function attachProgress(plan, enrollment) {
  const completed = new Set(enrollment?.completedTopics || []);
  const phases = (plan.phases || []).map(phase => {
    const topics = (phase.topics || []).map(topic => {
      const t = topic.toObject ? topic.toObject() : { ...topic };
      const topicId = t.id;
      return { ...t, id: topicId, completed: completed.has(topicId) };
    });
    const done = topics.filter(t => t.completed).length;
    return {
      ...phase,
      topics,
      completedTopics: done,
      totalTopics: topics.length,
      progress: topics.length ? Math.round((done / topics.length) * 100) : 0
    };
  });

  const totalTopics = phases.reduce((s, p) => s + p.totalTopics, 0);
  const completedTopics = phases.reduce((s, p) => s + p.completedTopics, 0);

  return {
    ...plan.toObject(),
    phases,
    enrolled: !!enrollment,
    isActive: enrollment?.isActive ?? false,
    enrolledAt: enrollment?.enrolledAt,
    completedTopics,
    totalTopics,
    progress: totalTopics ? Math.round((completedTopics / totalTopics) * 100) : 0
  };
}

function findEnrollment(user, planId) {
  return user.studyPlanEnrollments?.find(e =>
    e.plan?.toString() === planId.toString()
  );
}

// GET /api/study-plans
router.get('/', auth, async (req, res) => {
  try {
    const plans = await StudyPlan.find({ isPublished: true }).sort({ order: 1 });
    const user = await User.findById(req.user.userId).select('studyPlanEnrollments');

    const withProgress = plans.map(plan => {
      const enrollment = findEnrollment(user, plan._id);
      return attachProgress(plan, enrollment);
    });

    const active = withProgress.find(p => p.isActive) || null;

    res.json({ plans: withProgress, activePlan: active });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/study-plans/:slug
router.get('/:slug', auth, async (req, res) => {
  try {
    const plan = await StudyPlan.findOne({ slug: req.params.slug, isPublished: true });
    if (!plan) return res.status(404).json({ message: 'Study plan not found' });

    const user = await User.findById(req.user.userId).select('studyPlanEnrollments');
    const enrollment = findEnrollment(user, plan._id);

    res.json(attachProgress(plan, enrollment));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/study-plans/:id/enroll
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.id);
    if (!plan || !plan.isPublished) {
      return res.status(404).json({ message: 'Study plan not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!user.studyPlanEnrollments) user.studyPlanEnrollments = [];

    const existing = findEnrollment(user, plan._id);
    if (existing) {
      user.studyPlanEnrollments.forEach(e => { e.isActive = false; });
      existing.isActive = true;
    } else {
      user.studyPlanEnrollments.forEach(e => { e.isActive = false; });
      user.studyPlanEnrollments.push({
        plan: plan._id,
        enrolledAt: new Date(),
        completedTopics: [],
        isActive: true
      });
    }

    await user.save();
    res.json({
      message: `Enrolled in "${plan.title}"`,
      plan: attachProgress(plan, findEnrollment(user, plan._id))
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/study-plans/:id/topics/:topicId/toggle
router.post('/:id/topics/:topicId/toggle', auth, async (req, res) => {
  try {
    const plan = await StudyPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Study plan not found' });

    const topicExists = plan.phases?.some(p =>
      p.topics?.some(t => t.id === req.params.topicId)
    );
    if (!topicExists) return res.status(404).json({ message: 'Topic not found' });

    const user = await User.findById(req.user.userId);
    let enrollment = findEnrollment(user, plan._id);

    if (!enrollment) {
      user.studyPlanEnrollments = user.studyPlanEnrollments || [];
      user.studyPlanEnrollments.forEach(e => { e.isActive = false; });
      user.studyPlanEnrollments.push({
        plan: plan._id,
        enrolledAt: new Date(),
        completedTopics: [],
        isActive: true
      });
      enrollment = user.studyPlanEnrollments[user.studyPlanEnrollments.length - 1];
    }

    const idx = enrollment.completedTopics.indexOf(req.params.topicId);
    if (idx >= 0) enrollment.completedTopics.splice(idx, 1);
    else enrollment.completedTopics.push(req.params.topicId);

    await user.save();
    res.json({
      message: idx >= 0 ? 'Topic marked incomplete' : 'Topic completed',
      plan: attachProgress(plan, enrollment)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
