const express = require('express');
const Challenge = require('../models/Challenge');
const Lab = require('../models/Lab');
const LearningPath = require('../models/LearningPath');
const ReferenceArticle = require('../models/ReferenceArticle');
const StudyPlan = require('../models/StudyPlan');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (!q || q.length < 2) {
      return res.json({ challenges: [], labs: [], paths: [], articles: [], studyPlans: [] });
    }

    const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

    const [challenges, labs, paths, articles, studyPlans] = await Promise.all([
      Challenge.find({ $or: [{ title: regex }, { description: regex }, { category: regex }, { mitreTags: regex }] })
        .select('-flag').limit(20),
      Lab.find({ isActive: true, $or: [{ title: regex }, { description: regex }, { category: regex }, { mitreTags: regex }] })
        .select('-flag').limit(20),
      LearningPath.find({ $or: [{ title: regex }, { description: regex }] }).limit(10),
      ReferenceArticle.find({
        isPublished: true,
        $or: [{ title: regex }, { summary: regex }, { tags: regex }, { category: regex }]
      }).select('slug title summary icon category').limit(15),
      StudyPlan.find({
        isPublished: true,
        $or: [{ title: regex }, { description: regex }, { subtitle: regex }, { career: regex }]
      }).select('slug title subtitle icon career duration').limit(8)
    ]);

    res.json({ challenges, labs, paths, articles, studyPlans, query: q });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Search failed' });
  }
});

module.exports = router;
