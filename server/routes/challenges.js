const express = require('express');
const path = require('path');
const { body, validationResult } = require('express-validator');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const auth = require('../middleware/auth');
const requireStaff = require('../middleware/requireStaff');
const { canManageChallenge } = require('../middleware/requireStaff');
const rateLimit = require('express-rate-limit');
const Notification = require('../models/Notification');
const { checkAndAward } = require('../utils/achievements');
const { updateLevel, awardBadge } = require('../utils/progression');
const requireVerified = require('../middleware/requireVerified');
const { logActivity } = require('../utils/activity');
const { recordDailyActive } = require('../utils/recordDailyActive');
const { getTheoryForItem } = require('../data/theoryLessons');
const { getLearningObjectives } = require('../data/learningObjectives');
const {
  upload,
  UPLOAD_ROOT,
  MAX_FILES,
  deleteChallengeFiles,
  deleteStoredFile,
  ALLOWED_EXTENSIONS
} = require('../utils/challengeUpload');

const flagLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many flag attempts, slow down!' }
});

const router = express.Router();

const publicFiles = (files) =>
  (files || []).map(f => ({
    _id: f._id,
    originalName: f.originalName,
    size: f.size,
    mimeType: f.mimeType,
    uploadedAt: f.uploadedAt
  }));

const parseHintCosts = (hints, hintCosts) => {
  if (Array.isArray(hintCosts) && hintCosts.length) return hintCosts;
  return hints.map((_, i) => (i === 0 ? 0 : i === 1 ? 10 : 25));
};

// Staff: list challenges with full metadata for builder
router.get('/manage/list', auth, requireStaff, async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : { createdBy: req.user.userId };

    const challenges = await Challenge.find(filter)
      .select('+flag')
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username');

    res.json(challenges.map(c => ({
      ...c.toObject(),
      fileCount: c.files?.length || 0
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all challenges (protected)
router.get('/', auth, async (req, res) => {
  try {
    const challenges = await Challenge.find()
      .select('-flag')
      .sort({ category: 1, difficulty: 1 });

    res.json(challenges.map(c => ({
      ...c.toObject(),
      files: publicFiles(c.files)
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload config for builder UI
router.get('/builder/config', auth, requireStaff, (req, res) => {
  res.json({
    maxFiles: MAX_FILES,
    maxFileSizeMb: 50,
    allowedExtensions: ALLOWED_EXTENSIONS
  });
});

// Get single challenge (protected)
router.get('/:id', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .select('-flag');

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json({
      ...challenge.toObject(),
      files: publicFiles(challenge.files)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Staff: get challenge for editing (includes flag)
router.get('/:id/manage', auth, requireStaff, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .populate('createdBy', 'username');

    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (!canManageChallenge(challenge, req.user.userId, req.user.role)) {
      return res.status(403).json({ message: 'You can only edit your own challenges' });
    }

    res.json(challenge);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Download challenge attachment
router.get('/:id/files/:fileId', auth, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const file = challenge.files?.id(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    const filePath = path.join(UPLOAD_ROOT, challenge._id.toString(), file.storedName);
    res.download(filePath, file.originalName);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Download failed' });
  }
});

// Submit flag (protected)
// Reveal hint (costs points after first free hint)
router.post('/:id/hint/:index', auth, async (req, res) => {
  try {
    const index = parseInt(req.params.index, 10);
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (!challenge.hints?.[index]) return res.status(404).json({ message: 'Hint not found' });

    const user = await User.findById(req.user.userId);
    let hintRecord = user.hintsRevealed.find(h => h.challengeId.toString() === req.params.id);
    if (!hintRecord) {
      hintRecord = { challengeId: challenge._id, count: 0 };
      user.hintsRevealed.push(hintRecord);
    }

    if (index >= hintRecord.count) {
      const costs = challenge.hintCosts || [0, 10, 25];
      const cost = costs[index] ?? 25;
      if (cost > 0 && user.points < cost) {
        return res.status(400).json({ message: `Need ${cost} points to unlock this hint` });
      }
      if (cost > 0) user.points -= cost;
      hintRecord.count = index + 1;
      await user.save();
    }

    res.json({
      hint: challenge.hints[index],
      index,
      costPaid: index > 0 ? (challenge.hintCosts?.[index] ?? 25) : 0,
      totalPoints: user.points
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:id/submit', auth, requireVerified, flagLimiter, [

  body('flag').trim().notEmpty().withMessage('Flag is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    const user = await User.findById(req.user.userId);

    // Check if already solved
    if (user.solvedChallenges.includes(challenge._id)) {
      return res.status(400).json({ message: 'You already solved this challenge' });
    }

    // Check flag
    if (req.body.flag !== challenge.flag) {
      return res.status(400).json({ message: 'Wrong flag, try again!' });
    }

    // Award points
    user.solvedChallenges.push(challenge._id);
    user.points += challenge.points;

    updateLevel(user);

    // Award badge for first solve
      if (user.solvedChallenges.length === 1 && awardBadge(user, 'First Blood', 'Solved your first challenge!')) {
        await Notification.create({
          user: user._id,
          title: '🏅 Badge Earned!',
          message: 'You earned the "First Blood" badge for solving your first challenge!',
          type: 'badge',
          icon: '🏅',
          link: '/profile'
        });
      }

      // Notification for solving challenge
      await Notification.create({
        user: user._id,
        title: '✅ Challenge Solved!',
        message: `You solved "${challenge.title}" and earned ${challenge.points} points!`,
        type: 'challenge',
        icon: '🚩',
        link: '/challenges'
      });

    const newAchievements = await checkAndAward(user);
    await user.save();
    challenge.solvedBy.push(user._id);
    await challenge.save();

    await logActivity(user, 'challenge', `solved "${challenge.title}"`, '🚩', '/challenges');
    recordDailyActive(user._id);

    res.json({
      message: 'Correct flag! Well done!',
      pointsEarned: challenge.points,
      totalPoints: user.points,
      level: user.level,
      badges: user.badges,
      newAchievements
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create challenge (admin / instructor)
router.post('/', auth, requireStaff, [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['web', 'network', 'linux', 'forensics']).withMessage('Invalid category'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty'),
  body('points').isInt({ min: 10, max: 1000 }).withMessage('Points must be 10–1000'),
  body('flag').trim().notEmpty().withMessage('Flag is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
    }

    const { title, description, category, difficulty, points, flag, hints, hintCosts, mitreTags } = req.body;
    const hintsArr = Array.isArray(hints)
      ? hints.filter(h => h?.trim())
      : (typeof hints === 'string' ? hints.split('\n').map(h => h.trim()).filter(Boolean) : []);

    const challenge = new Challenge({
      title,
      description,
      category,
      difficulty,
      points: parseInt(points, 10),
      flag: flag.trim(),
      hints: hintsArr,
      hintCosts: parseHintCosts(hintsArr, hintCosts),
      mitreTags: mitreTags || [],
      theoryLesson: getTheoryForItem(title, category),
      learningObjectives: getLearningObjectives(title, category),
      createdBy: req.user.userId
    });

    await challenge.save();
    res.status(201).json({
      message: 'Challenge created',
      challenge: {
        ...challenge.toObject(),
        files: []
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update challenge (admin / owner instructor)
router.put('/:id', auth, requireStaff, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (!canManageChallenge(challenge, req.user.userId, req.user.role)) {
      return res.status(403).json({ message: 'You can only edit your own challenges' });
    }

    const { title, description, category, difficulty, points, flag, hints, hintCosts, mitreTags } = req.body;
    const hintsArr = hints != null
      ? (Array.isArray(hints) ? hints : hints.split('\n').map(h => h.trim()).filter(Boolean))
      : challenge.hints;

    if (title != null) challenge.title = title;
    if (description != null) challenge.description = description;
    if (category != null) challenge.category = category;
    if (difficulty != null) challenge.difficulty = difficulty;
    if (points != null) challenge.points = parseInt(points, 10);
    if (flag != null) challenge.flag = flag.trim();
    if (hints != null) {
      challenge.hints = hintsArr;
      challenge.hintCosts = parseHintCosts(hintsArr, hintCosts);
    }
    if (mitreTags != null) challenge.mitreTags = mitreTags;

    await challenge.save();
    res.json({ message: 'Challenge updated', challenge });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload files to challenge
router.post('/:id/files', auth, requireStaff, (req, res, next) => {
  upload.array('files', MAX_FILES)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload failed' });
    }
    next();
  });
}, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (!canManageChallenge(challenge, req.user.userId, req.user.role)) {
      return res.status(403).json({ message: 'You can only upload to your own challenges' });
    }

    if (!req.files?.length) {
      return res.status(400).json({ message: 'No files provided' });
    }

    const remaining = MAX_FILES - (challenge.files?.length || 0);
    if (req.files.length > remaining) {
      req.files.slice(remaining).forEach(f => deleteStoredFile(challenge._id, f.filename));
      return res.status(400).json({
        message: `Maximum ${MAX_FILES} files per challenge (${remaining} slots left)`
      });
    }

    for (const file of req.files) {
      challenge.files.push({
        originalName: file.originalname,
        storedName: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy: req.user.userId
      });
    }

    await challenge.save();
    res.json({
      message: `${req.files.length} file(s) uploaded`,
      files: publicFiles(challenge.files)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed' });
  }
});

// Delete a challenge file
router.delete('/:id/files/:fileId', auth, requireStaff, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (!canManageChallenge(challenge, req.user.userId, req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const file = challenge.files?.id(req.params.fileId);
    if (!file) return res.status(404).json({ message: 'File not found' });

    deleteStoredFile(challenge._id, file.storedName);
    challenge.files.pull(req.params.fileId);
    await challenge.save();

    res.json({ message: 'File deleted', files: publicFiles(challenge.files) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete challenge (admin or owner instructor)
router.delete('/:id', auth, requireStaff, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (!canManageChallenge(challenge, req.user.userId, req.user.role)) {
      return res.status(403).json({ message: 'You can only delete your own challenges' });
    }

    deleteChallengeFiles(challenge._id);
    await Challenge.findByIdAndDelete(req.params.id);
    res.json({ message: 'Challenge deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get writeup (only for solved challenges)
router.get('/:id/writeup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const challenge = await Challenge.findById(req.params.id);

    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    if (!user.solvedChallenges.includes(challenge._id)) {
      return res.status(403).json({ 
        message: 'Solve this challenge first to unlock the writeup!' 
      });
    }

    res.json(challenge.writeup);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update writeup (admin / owner instructor)
router.put('/:id/writeup', auth, requireStaff, async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
    if (!canManageChallenge(challenge, req.user.userId, req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    challenge.writeup = req.body;
    await challenge.save();

    res.json({ message: 'Writeup updated', writeup: challenge.writeup });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;