const express = require('express');
const UserWriteup = require('../models/UserWriteup');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/challenge/:challengeId', auth, async (req, res) => {
  try {
    const writeups = await UserWriteup.find({ challenge: req.params.challengeId })
      .sort({ upvotes: -1, createdAt: -1 })
      .limit(20);
    res.json(writeups.map(w => ({
      ...w.toObject(),
      upvoteCount: w.upvotes.length,
      upvoted: w.upvotes.some(id => id.toString() === req.user.userId)
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { challengeId, title, content } = req.body;
    const user = await User.findById(req.user.userId);
    const challenge = await Challenge.findById(challengeId);

    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (!user.solvedChallenges.map(id => id.toString()).includes(challengeId)) {
      return res.status(403).json({ message: 'Solve the challenge first to submit a writeup' });
    }

    const existing = await UserWriteup.findOne({ challenge: challengeId, user: req.user.userId });
    if (existing) return res.status(400).json({ message: 'You already submitted a writeup for this challenge' });

    const writeup = await UserWriteup.create({
      challenge: challengeId,
      user: req.user.userId,
      username: user.username,
      title,
      content
    });
    res.status(201).json({ message: 'Writeup submitted', writeup });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const writeup = await UserWriteup.findById(req.params.id);
    if (!writeup) return res.status(404).json({ message: 'Not found' });

    const idx = writeup.upvotes.findIndex(id => id.toString() === req.user.userId);
    if (idx >= 0) writeup.upvotes.splice(idx, 1);
    else writeup.upvotes.push(req.user.userId);

    await writeup.save();
    res.json({ upvoteCount: writeup.upvotes.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
