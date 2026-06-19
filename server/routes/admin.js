const express = require('express');
const User = require('../models/User');
const Lab = require('../models/Lab');
const LearningPath = require('../models/LearningPath');
const Challenge = require('../models/Challenge');
const auth = require('../middleware/auth');
const { getAdminAnalytics } = require('../utils/adminAnalytics');

const router = express.Router();

const requireStaff = (req, res, next) => {
  if (!['admin', 'instructor'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

router.use(auth, requireStaff);

// Users
router.get('/users', async (req, res) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 }).limit(100);
  res.json(users);
});

router.put('/users/:id/role', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true })
    .select('-password');
  res.json(user);
});

// Labs CRUD
router.get('/labs', async (req, res) => {
  const labs = await Lab.find().sort({ createdAt: -1 });
  res.json(labs);
});

router.put('/labs/:id', async (req, res) => {
  const lab = await Lab.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(lab);
});

// Paths CRUD
router.get('/paths', async (req, res) => {
  const paths = await LearningPath.find().sort({ order: 1 });
  res.json(paths);
});

router.put('/paths/:id', async (req, res) => {
  const path = await LearningPath.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(path);
});

router.put('/paths/:pathId/modules/:moduleId/quiz', async (req, res) => {
  const path = await LearningPath.findById(req.params.pathId);
  if (!path) return res.status(404).json({ message: 'Path not found' });
  const mod = path.modules.id(req.params.moduleId);
  if (!mod) return res.status(404).json({ message: 'Module not found' });
  mod.quiz = req.body.quiz || [];
  mod.passThreshold = req.body.passThreshold || 80;
  await path.save();
  res.json({ message: 'Quiz updated', module: mod });
});

// Admin analytics dashboard
router.get('/analytics', async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }
  try {
    const analytics = await getAdminAnalytics();
    res.json(analytics);
  } catch (err) {
    console.error('Admin analytics error:', err);
    res.status(500).json({ message: 'Analytics failed' });
  }
});

// Stats
router.get('/stats', async (req, res) => {
  const [users, challenges, labs, paths] = await Promise.all([
    User.countDocuments(),
    Challenge.countDocuments(),
    Lab.countDocuments(),
    LearningPath.countDocuments()
  ]);
  res.json({ users, challenges, labs, paths });
});

module.exports = router;
