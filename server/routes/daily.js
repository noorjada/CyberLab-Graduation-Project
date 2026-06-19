const express = require('express');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const { checkAndAward } = require('../utils/achievements');
const { updateLevel, awardBadge } = require('../utils/progression');

const router = express.Router();

// Get today's daily challenge
router.get('/', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find().select('-flag');
    if (challenges.length === 0) {
      return res.status(404).json({ message: 'No challenges available' });
    }

    // Pick challenge based on day of year so everyone gets same challenge
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
    );
    const index = dayOfYear % challenges.length;
    const dailyChallenge = challenges[index];

    const user = await User.findById(req.user.userId);
    const today = new Date().toDateString();
    const lastSolved = user.lastSolvedDate
      ? new Date(user.lastSolvedDate).toDateString()
      : null;

    res.json({
      challenge: dailyChallenge,
      alreadySolvedToday: lastSolved === today,
      streak: user.dailyStreak || 0,
      bonusXP: 50
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit daily challenge flag
router.post('/submit', auth, async (req, res) => {
  try {
    const { flag } = req.body;

    const challenges = await Challenge.find();
    if (challenges.length === 0) {
      return res.status(404).json({ message: 'No challenges available' });
    }

    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
    );
    const index = dayOfYear % challenges.length;
    const dailyChallenge = challenges[index];

    const user = await User.findById(req.user.userId);
    const today = new Date().toDateString();
    const lastSolved = user.lastSolvedDate
      ? new Date(user.lastSolvedDate).toDateString()
      : null;
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (lastSolved === today) {
      return res.status(400).json({ message: 'Already solved today\'s challenge!' });
    }

    if (flag !== dailyChallenge.flag) {
      return res.status(400).json({ message: 'Wrong flag, try again!' });
    }

    // Update streak
    if (lastSolved === yesterday) {
      user.dailyStreak = (user.dailyStreak || 0) + 1;
    } else {
      user.dailyStreak = 1;
    }

    user.lastSolvedDate = new Date();

    // Bonus XP
    const bonusXP = 50 + (user.dailyStreak * 10);
    user.xp = (user.xp || 0) + bonusXP;
    user.points = (user.points || 0) + dailyChallenge.points;
    updateLevel(user);

    if (!user.solvedChallenges.includes(dailyChallenge._id)) {
      user.solvedChallenges.push(dailyChallenge._id);
      dailyChallenge.solvedBy.push(user._id);
      await dailyChallenge.save();
    }

    // Streak badges (deduplicated)
    if (user.dailyStreak === 3) {
      awardBadge(user, 'On Fire!', '3 day streak!');
    }
    if (user.dailyStreak === 7) {
      awardBadge(user, 'Week Warrior', '7 day streak!');
    }
    if (user.dailyStreak === 30) {
      awardBadge(user, 'Monthly Master', '30 day streak!');
    }

    const newAchievements = await checkAndAward(user);

    await Notification.create({
      user: user._id,
      title: '🔥 Daily Challenge Solved!',
      message: `You solved today's challenge! +${bonusXP} bonus XP, ${user.dailyStreak}-day streak.`,
      type: 'challenge',
      icon: '🔥',
      link: '/daily'
    }).catch(() => {});

    await user.save();

    res.json({
      message: 'Daily challenge solved!',
      bonusXP,
      streak: user.dailyStreak,
      points: user.points,
      level: user.level,
      newAchievements
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;