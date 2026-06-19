const express = require('express');
const Rating = require('../models/Rating');
const Challenge = require('../models/Challenge');
const Lab = require('../models/Lab');
const auth = require('../middleware/auth');

const router = express.Router();

async function updateAggregate(itemType, itemId) {
  const ratings = await Rating.find({ itemType, itemId });
  const count = ratings.length;
  const avg = count ? ratings.reduce((s, r) => s + r.score, 0) / count : 0;
  const Model = itemType === 'challenge' ? Challenge : Lab;
  await Model.findByIdAndUpdate(itemId, { ratingAvg: Math.round(avg * 10) / 10, ratingCount: count });
  return { avg: Math.round(avg * 10) / 10, count };
}

router.post('/', auth, async (req, res) => {
  try {
    const { itemType, itemId, score } = req.body;
    if (!['challenge', 'lab'].includes(itemType) || !score || score < 1 || score > 5) {
      return res.status(400).json({ message: 'Invalid rating' });
    }

    await Rating.findOneAndUpdate(
      { user: req.user.userId, itemType, itemId },
      { score },
      { upsert: true, new: true }
    );

    const stats = await updateAggregate(itemType, itemId);
    res.json({ message: 'Rating saved', ...stats });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:itemType/:itemId', auth, async (req, res) => {
  try {
    const mine = await Rating.findOne({
      user: req.user.userId,
      itemType: req.params.itemType,
      itemId: req.params.itemId
    });
    const Model = req.params.itemType === 'challenge' ? Challenge : Lab;
    const item = await Model.findById(req.params.itemId).select('ratingAvg ratingCount');
    res.json({
      ratingAvg: item?.ratingAvg || 0,
      ratingCount: item?.ratingCount || 0,
      userScore: mine?.score || null
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
