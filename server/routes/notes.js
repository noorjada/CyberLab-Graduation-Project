const express = require('express');
const LearningNote = require('../models/LearningNote');
const Challenge = require('../models/Challenge');
const Lab = require('../models/Lab');
const auth = require('../middleware/auth');

const router = express.Router();

const resolveLinkTitle = async (linkType, linkId) => {
  if (!linkId || linkType === 'general') return '';
  if (linkType === 'challenge') {
    const ch = await Challenge.findById(linkId).select('title');
    return ch?.title || '';
  }
  if (linkType === 'lab') {
    const lab = await Lab.findById(linkId).select('title');
    return lab?.title || '';
  }
  return '';
};

const validateLink = async (linkType, linkId) => {
  if (linkType === 'general' || !linkId) return true;
  if (linkType === 'challenge') {
    return !!(await Challenge.findById(linkId));
  }
  if (linkType === 'lab') {
    return !!(await Lab.findById(linkId));
  }
  return false;
};

const formatNote = (note) => ({
  _id: note._id,
  type: note.type,
  title: note.title,
  content: note.content,
  linkType: note.linkType,
  linkId: note.linkId,
  linkTitle: note.linkTitle,
  tags: note.tags || [],
  createdAt: note.createdAt,
  updatedAt: note.updatedAt
});

router.get('/', auth, async (req, res) => {
  try {
    const filter = { user: req.user.userId };
    if (req.query.type) filter.type = req.query.type;
    if (req.query.linkType) filter.linkType = req.query.linkType;
    if (req.query.linkId) filter.linkId = req.query.linkId;
    if (req.query.q) {
      const regex = new RegExp(req.query.q, 'i');
      filter.$or = [{ title: regex }, { content: regex }, { tags: regex }];
    }

    const notes = await LearningNote.find(filter).sort({ updatedAt: -1 }).limit(200);
    res.json(notes.map(formatNote));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await LearningNote.aggregate([
      { $match: { user: req.user.userId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const total = await LearningNote.countDocuments({ user: req.user.userId });
    const byType = Object.fromEntries(stats.map(s => [s._id, s.count]));
    res.json({ total, byType });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/linked/:linkType/:linkId', auth, async (req, res) => {
  try {
    const { linkType, linkId } = req.params;
    if (!['challenge', 'lab'].includes(linkType)) {
      return res.status(400).json({ message: 'Invalid link type' });
    }

    const notes = await LearningNote.find({
      user: req.user.userId,
      linkType,
      linkId
    }).sort({ updatedAt: -1 });

    res.json(notes.map(formatNote));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const note = await LearningNote.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(formatNote(note));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { type, title, content, linkType, linkId, linkTitle, tags } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const resolvedLinkType = linkType || 'general';
    if (!['note', 'command', 'writeup', 'summary'].includes(type || 'note')) {
      return res.status(400).json({ message: 'Invalid note type' });
    }

    if (resolvedLinkType !== 'general') {
      const valid = await validateLink(resolvedLinkType, linkId);
      if (!valid) return res.status(404).json({ message: 'Linked item not found' });
    }

    const resolvedTitle = linkTitle || await resolveLinkTitle(resolvedLinkType, linkId);

    const note = await LearningNote.create({
      user: req.user.userId,
      type: type || 'note',
      title: title.trim(),
      content: content.trim(),
      linkType: resolvedLinkType,
      linkId: resolvedLinkType === 'general' ? undefined : linkId,
      linkTitle: resolvedTitle,
      tags: Array.isArray(tags) ? tags.filter(Boolean) : []
    });

    res.status(201).json({ message: 'Note saved', note: formatNote(note) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const note = await LearningNote.findOne({
      _id: req.params.id,
      user: req.user.userId
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });

    const { type, title, content, linkType, linkId, linkTitle, tags } = req.body;
    if (type != null) note.type = type;
    if (title != null) note.title = title.trim();
    if (content != null) note.content = content.trim();
    if (tags != null) note.tags = Array.isArray(tags) ? tags.filter(Boolean) : note.tags;

    if (linkType != null) {
      note.linkType = linkType;
      if (linkType === 'general') {
        note.linkId = undefined;
        note.linkTitle = '';
      } else if (linkId) {
        const valid = await validateLink(linkType, linkId);
        if (!valid) return res.status(404).json({ message: 'Linked item not found' });
        note.linkId = linkId;
        note.linkTitle = linkTitle || await resolveLinkTitle(linkType, linkId);
      }
    }

    await note.save();
    res.json({ message: 'Note updated', note: formatNote(note) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await LearningNote.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
