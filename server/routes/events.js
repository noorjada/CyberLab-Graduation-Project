const express = require('express');
const Event = require('../models/Event');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { logActivity } = require('../utils/activity');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    const events = await Event.find({ isActive: true })
      .populate('challenges', 'title category difficulty points')
      .populate('labs', 'title category difficulty points')
      .sort({ startAt: -1 });
    res.json(events.map(e => ({
      ...e.toObject(),
      status: e.endAt < now ? 'ended' : e.startAt > now ? 'upcoming' : 'live'
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const already = event.participants.find(p => p.user.toString() === req.user.userId);
    if (!already) {
      event.participants.push({ user: req.user.userId });
      await event.save();
      const user = await User.findById(req.user.userId);
      await logActivity(user, 'event', `joined CTF event "${event.title}"`, '🏁', '/events');
    }
    res.json({ message: 'Joined event', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id/leaderboard', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants.user', 'username points level');
    if (!event) return res.status(404).json({ message: 'Event not found' });

    const board = [...event.participants]
      .sort((a, b) => b.points - a.points)
      .map((p, i) => ({
        rank: i + 1,
        username: p.user?.username || 'Unknown',
        points: p.points,
        solved: p.solvedChallenges?.length || 0,
        labs: p.completedLabs?.length || 0
      }));

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    if (!['admin', 'instructor'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const event = new Event({ ...req.body, createdBy: req.user.userId });
    await event.save();
    res.status(201).json({ message: 'Event created', event });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
