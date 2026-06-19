const express = require('express');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Lab = require('../models/Lab');
const LabSession = require('../models/LabSession');
const auth = require('../middleware/auth');

const router = express.Router();
const CATEGORIES = ['web', 'network', 'linux', 'forensics', 'crypto'];

router.get('/skills', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate('solvedChallenges', 'category difficulty');

    const solvedByCategory = {};
    CATEGORIES.forEach(c => { solvedByCategory[c] = 0; });

    (user.solvedChallenges || []).forEach(ch => {
      if (ch?.category) solvedByCategory[ch.category] = (solvedByCategory[ch.category] || 0) + 1;
    });

    const completedSessions = await LabSession.find({
      user: req.user.userId,
      flagSubmitted: true
    }).populate('lab', 'category difficulty title');

    const labsByCategory = {};
    CATEGORIES.forEach(c => { labsByCategory[c] = 0; });

    completedSessions.forEach(s => {
      if (s.lab?.category) labsByCategory[s.lab.category] = (labsByCategory[s.lab.category] || 0) + 1;
    });

    const totalByCategory = {};
    const [chCounts, labCounts] = await Promise.all([
      Challenge.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
      Lab.aggregate([{ $match: { isActive: true } }, { $group: { _id: '$category', count: { $sum: 1 } } }])
    ]);

    chCounts.forEach(c => { totalByCategory[c._id] = (totalByCategory[c._id] || 0) + c.count; });
    labCounts.forEach(c => { totalByCategory[c._id] = (totalByCategory[c._id] || 0) + c.count; });

    const radar = CATEGORIES.map(cat => {
      const solved = (solvedByCategory[cat] || 0) + (labsByCategory[cat] || 0);
      const total = totalByCategory[cat] || 1;
      return {
        category: cat,
        solved,
        total,
        percent: Math.min(Math.round((solved / total) * 100), 100)
      };
    });

    const weakAreas = radar.filter(r => r.percent < 30 && r.total > 0).map(r => r.category);
    const strongAreas = radar.filter(r => r.percent >= 60).map(r => r.category);

    res.json({ radar, weakAreas, strongAreas, solvedByCategory, labsByCategory });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Analytics failed' });
  }
});

module.exports = router;
