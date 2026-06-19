const express = require('express');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Lab = require('../models/Lab');
const LearningPath = require('../models/LearningPath');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('bookmarks');
    const bookmarks = user.bookmarks || [];

    const results = await Promise.all(bookmarks.map(async (b) => {
      let item = null;
      if (b.itemType === 'challenge') item = await Challenge.findById(b.itemId).select('-flag');
      if (b.itemType === 'lab') item = await Lab.findById(b.itemId).select('-flag');
      if (b.itemType === 'path') item = await LearningPath.findById(b.itemId);
      return item ? { ...b.toObject(), item } : null;
    }));

    res.json(results.filter(Boolean));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { itemType, itemId } = req.body;
    if (!['challenge', 'lab', 'path'].includes(itemType)) {
      return res.status(400).json({ message: 'Invalid item type' });
    }

    const user = await User.findById(req.user.userId);
    const exists = user.bookmarks.some(
      b => b.itemType === itemType && b.itemId.toString() === itemId
    );
    if (!exists) {
      user.bookmarks.push({ itemType, itemId });
      await user.save();
    }
    res.json({ message: 'Bookmarked', bookmarks: user.bookmarks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:itemType/:itemId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    user.bookmarks = user.bookmarks.filter(
      b => !(b.itemType === req.params.itemType && b.itemId.toString() === req.params.itemId)
    );
    await user.save();
    res.json({ message: 'Removed', bookmarks: user.bookmarks });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
