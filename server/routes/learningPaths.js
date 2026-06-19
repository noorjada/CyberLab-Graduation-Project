const express      = require('express');
const LearningPath = require('../models/LearningPath');
const Certificate  = require('../models/Certificate');
const User         = require('../models/User');
const Notification = require('../models/Notification');
const auth         = require('../middleware/auth');
const { checkAndAward } = require('../utils/achievements');
const { awardBadge } = require('../utils/progression');

const router = express.Router();

// Get all learning paths with user progress
router.get('/', auth, async (req, res) => {
  try {
    const trackOrder = { beginner: 1, intermediate: 2, advanced: 3 };
    const paths = await LearningPath.find();
    paths.sort((a, b) => {
      const diff = trackOrder[a.track] - trackOrder[b.track];
      return diff !== 0 ? diff : a.order - b.order;
    });
    const user = await User.findById(req.user.userId);

    const pathsWithProgress = paths.map(path => {
      const completedCount = path.modules.filter(m =>
        user.completedModules.map(id => id.toString()).includes(m._id.toString())
      ).length;
      return {
        ...path.toObject(),
        completedModules: completedCount,
        totalModules: path.modules.length,
        progress: path.modules.length > 0 ? Math.round((completedCount / path.modules.length) * 100) : 0,
        isUnlocked: true
      };
    });

    res.json(pathsWithProgress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single learning path
router.get('/:id', auth, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.id);
    if (!path) return res.status(404).json({ message: 'Path not found' });
    res.json(path);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit module quiz
router.post('/:pathId/modules/:moduleId/quiz', auth, async (req, res) => {
  try {
    const path = await LearningPath.findById(req.params.pathId);
    if (!path) return res.status(404).json({ message: 'Path not found' });
    const module = path.modules.id(req.params.moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    if (!module.quiz?.length) {
      return res.json({ passed: true, score: 100, message: 'No quiz required' });
    }

    const answers = req.body.answers || [];
    let correct = 0;
    module.quiz.forEach((q, i) => {
      if (answers[i] === q.correctIndex) correct++;
    });
    const score = Math.round((correct / module.quiz.length) * 100);
    const passed = score >= (module.passThreshold || 80);

    res.json({ passed, score, required: module.passThreshold || 80 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete a module
router.post('/:pathId/modules/:moduleId/complete', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const path = await LearningPath.findById(req.params.pathId);

    if (!path)   return res.status(404).json({ message: 'Path not found' });
    const module = path.modules.id(req.params.moduleId);
    if (!module) return res.status(404).json({ message: 'Module not found' });

    if (module.quiz?.length) {
      const answers = req.body.answers || [];
      let correct = 0;
      module.quiz.forEach((q, i) => {
        if (answers[i] === q.correctIndex) correct++;
      });
      const score = Math.round((correct / module.quiz.length) * 100);
      if (score < (module.passThreshold || 80)) {
        return res.status(400).json({
          message: `Quiz score ${score}% — need ${module.passThreshold || 80}% to complete`,
          score,
          passed: false
        });
      }
    }

    let xpEarned = 0;
    if (!user.completedModules.map(id => id.toString()).includes(req.params.moduleId)) {
      user.completedModules.push(req.params.moduleId);
      user.xp += module.xpReward;
      xpEarned = module.xpReward;

      // Streak
      const today    = new Date().toDateString();
      const lastActive = new Date(user.lastActiveDate).toDateString();
      if (today !== lastActive) {
        user.streak += 1;
        user.dailyStreak = user.streak;
        user.lastActiveDate = new Date();
      }

      // Module milestone badges
      if (user.completedModules.length === 1) {
        awardBadge(user, 'First Step', 'Completed your first learning module!');
      }
      if (user.completedModules.length === 5) {
        awardBadge(user, 'Knowledge Seeker', 'Completed 5 learning modules!');
      }

      await user.save();
    }

    // ── Check if entire path is now complete ──────────────────────
    const allModuleIds    = path.modules.map(m => m._id.toString());
    const userModuleIds   = user.completedModules.map(id => id.toString());
    const pathComplete    = allModuleIds.length > 0 && allModuleIds.every(id => userModuleIds.includes(id));

    let certificate   = null;
    let newAchievements = [];

    if (pathComplete) {
      // Create certificate (idempotent)
      let cert = await Certificate.findOne({ user: user._id, learningPath: path._id });
      if (!cert) {
        const totalXp = path.modules.reduce((s, m) => s + (m.xpReward || 0), 0);
        cert = await Certificate.create({
          user:           user._id,
          learningPath:   path._id,
          pathTitle:      path.title,
          pathTrack:      path.track,
          pathCareerPath: path.careerPath || 'general',
          pathIcon:       path.icon || '🛡️',
          xpEarned:       totalXp,
          totalModules:   path.modules.length
        });

        // Increment completed paths counter
        user.completedPaths = (user.completedPaths || 0) + 1;
        awardBadge(user, `${path.title} Graduate`, `Completed the "${path.title}" learning path!`);
        await user.save();

        await Notification.create({
          user:    user._id,
          title:   '📜 Certificate Earned!',
          message: `Congratulations! You completed "${path.title}" and earned a certificate!`,
          type:    'system',
          icon:    '📜',
          link:    '/certificates'
        });
      }
      certificate = cert;

      // Check achievements after path completion
      const freshUser = await User.findById(user._id);
      newAchievements = await checkAndAward(freshUser);
      if (newAchievements.length > 0) await freshUser.save();
    }

    // Check achievements for XP milestones after module completion
    const freshUser2 = await User.findById(user._id);
    const xpAchievements = await checkAndAward(freshUser2);
    if (xpAchievements.length > 0) await freshUser2.save();
    newAchievements = [...newAchievements, ...xpAchievements];

    res.json({
      message:       'Module completed!',
      xpEarned,
      totalXp:       user.xp,
      streak:        user.streak,
      badges:        user.badges,
      pathCompleted: pathComplete,
      certificate:   certificate ? {
        certificateId: certificate.certificateId,
        pathTitle:     certificate.pathTitle
      } : null,
      newAchievements
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create learning path (admin only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' });
    const path = new LearningPath(req.body);
    await path.save();
    res.status(201).json({ message: 'Learning path created', path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
