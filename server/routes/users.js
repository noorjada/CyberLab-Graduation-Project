const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get current user profile (protected)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('solvedChallenges', 'title category difficulty points');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Existing users with progress skip onboarding (legacy accounts)
    if (!user.onboardingComplete) {
      const hasProgress =
        user.points > 0 ||
        user.solvedChallenges?.length > 0 ||
        user.completedModules?.length > 0 ||
        (user.completedLabs || 0) > 0 ||
        (user.completedPaths || 0) > 0;
      if (hasProgress) {
        user.onboardingComplete = true;
        await user.save();
      }
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leaderboard (public)
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find()
      .select('username points level xp badges solvedChallenges')
      .sort({ points: -1 })
      .limit(50);

    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile preferences
router.put('/me', auth, async (req, res) => {
  try {
    const allowed = ['careerPath', 'currentTrack', 'theme', 'digestEnabled', 'onboardingComplete'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true })
      .select('-password')
      .populate('solvedChallenges', 'title category difficulty points');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Public profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username points level xp badges achievements dailyStreak createdAt')
      .populate('solvedChallenges', 'title category');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;