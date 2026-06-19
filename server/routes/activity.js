const express = require('express');
const Activity = require('../models/Activity');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(30)
      .select('-__v');
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
