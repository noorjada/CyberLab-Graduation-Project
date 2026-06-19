const express = require('express');
const ReferenceArticle = require('../models/ReferenceArticle');
const auth = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = [
  { id: 'roles', label: 'Careers & Roles', icon: '👔' },
  { id: 'ethical-hacking', label: 'Ethical Hacking', icon: '🎯' },
  { id: 'pentesting', label: 'Penetration Testing', icon: '🔓' },
  { id: 'forensics', label: 'Digital Forensics', icon: '🔍' },
  { id: 'blue-team', label: 'Blue Team & SOC', icon: '🛡️' },
  { id: 'governance', label: 'Governance & Risk', icon: '📋' },
  { id: 'fundamentals', label: 'Fundamentals', icon: '📖' },
  { id: 'tools', label: 'Tools & Libraries', icon: '🧰' },
  { id: 'resources', label: 'Learning Resources', icon: '🌐' },
  { id: 'certifications', label: 'Certifications', icon: '🎓' }
];

router.get('/meta', auth, (_req, res) => {
  res.json({ categories: CATEGORIES });
});

router.get('/', auth, async (req, res) => {
  try {
    const { category, q, tag, difficulty, featured } = req.query;
    const filter = { isPublished: true };

    if (category && category !== 'all') filter.category = category;
    if (difficulty && difficulty !== 'all') filter.difficulty = difficulty;
    if (featured === 'true') filter.featured = true;
    if (tag) filter.tags = tag;

    if (q && q.trim().length >= 2) {
      const regex = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { title: regex },
        { summary: regex },
        { tags: regex },
        { subcategory: regex }
      ];
    }

    const articles = await ReferenceArticle.find(filter)
      .select('-sections')
      .sort({ featured: -1, order: 1, title: 1 });

    const counts = await ReferenceArticle.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const countMap = Object.fromEntries(counts.map(c => [c._id, c.count]));

    res.json({
      articles,
      total: articles.length,
      counts: countMap,
      categories: CATEGORIES
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load reference articles' });
  }
});

router.get('/:slug', auth, async (req, res) => {
  try {
    const article = await ReferenceArticle.findOne({
      slug: req.params.slug.toLowerCase(),
      isPublished: true
    });

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    let related = [];
    if (article.relatedSlugs?.length) {
      related = await ReferenceArticle.find({
        slug: { $in: article.relatedSlugs },
        isPublished: true
      }).select('slug title summary icon category readingMinutes difficulty');
    }

    res.json({ article, related });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load article' });
  }
});

module.exports = router;
