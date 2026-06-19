const express = require('express');
const Lab = require('../models/Lab');
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/requireAdmin');
const { enrichLab } = require('../utils/labEnrichment');
const { getTheoryForItem } = require('../data/theoryLessons');
const { getLearningObjectives } = require('../data/learningObjectives');
const { resolveLabFlags } = require('../utils/labFlagSync');
const fs = require('fs');
const path = require('path');
const {
  validateSlug,
  writeLabFiles,
  buildLabImage,
  listLabFiles,
  removeLabFiles,
  removeDockerImage,
  LABS_ROOT
} = require('../utils/labDockerBuilder');

const router = express.Router();

router.use(auth, requireAdmin);

router.get('/labs', async (req, res) => {
  try {
    const labs = await Lab.find().sort({ createdAt: -1 }).select('-flag -flags.flag');
    res.json(labs);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/labs/by-id/:id', async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });
    res.json(lab);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/labs/:slug/files', async (req, res) => {
  try {
    const files = await listLabFiles(req.params.slug);
    res.json({ slug: req.params.slug, files });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

function buildEnrichedDraft(draft, userId) {
  const dockerImage = draft.dockerImage || `cyberlab-${draft.slug}`;
  const { flag, flags } = resolveLabFlags(draft);

  const title = draft.title.trim();
  const category = draft.category || 'web';
  return {
    ...enrichLab({
      title,
      description: draft.description?.trim() || '',
      category,
      difficulty: draft.difficulty || 'medium',
      points: parseInt(draft.points, 10) || 100,
      flag,
      flags,
      dockerImage,
      slug: draft.slug,
      tasks: draft.tasks || [],
      tools: draft.tools || [],
      hints: draft.hints || [],
      mitreTags: draft.mitreTags || [],
      estimatedTime: parseInt(draft.estimatedTime, 10) || 30,
      walkthrough: draft.walkthrough,
      createdBy: userId
    }),
    theoryLesson: getTheoryForItem(title, category),
    learningObjectives: getLearningObjectives(title, category)
  };
}

async function finalizeBuild(lab, slug, dockerImage, skipBuild) {
  if (skipBuild) {
    lab.buildStatus = 'draft';
    lab.isActive = false;
    lab.buildError = '';
    await lab.save();
    return { message: 'Lab saved as draft (Docker build skipped)', buildLog: null };
  }

  try {
    const build = await buildLabImage(slug, dockerImage);
    lab.buildStatus = 'ready';
    lab.buildError = '';
    lab.isActive = true;
    await lab.save();
    return {
      message: 'Docker image built and lab is live',
      buildLog: build.log?.slice(-2000)
    };
  } catch (buildErr) {
    lab.buildStatus = 'failed';
    lab.buildError = buildErr.message || 'Docker build failed';
    lab.isActive = false;
    await lab.save();
    const err = new Error(`Docker build failed: ${lab.buildError}`);
    err.lab = lab;
    err.buildError = lab.buildError;
    throw err;
  }
}

router.post('/publish', async (req, res) => {
  try {
    const { draft, skipBuild } = req.body;
    if (!draft?.slug || !draft?.title || !draft?.files?.length) {
      return res.status(400).json({ message: 'Complete lab draft with slug, title, and files required' });
    }

    validateSlug(draft.slug);

    const existing = await Lab.findOne({ slug: draft.slug });
    const enriched = buildEnrichedDraft(draft, req.user.userId);
    const dockerImage = enriched.dockerImage;

    await writeLabFiles(draft.slug, draft.files);

    let lab;
    let updated = false;

    if (existing) {
      updated = true;
      const keep = {
        completedBy: existing.completedBy,
        ratingAvg: existing.ratingAvg,
        ratingCount: existing.ratingCount,
        createdAt: existing.createdAt,
        createdBy: existing.createdBy || req.user.userId
      };
      Object.assign(existing, enriched, keep);
      existing.buildStatus = skipBuild ? 'draft' : 'building';
      existing.buildError = '';
      existing.isActive = false;
      await existing.save();
      lab = existing;
    } else {
      enriched.isActive = false;
      enriched.buildStatus = skipBuild ? 'draft' : 'building';
      lab = await Lab.create(enriched);
    }

    try {
      const result = await finalizeBuild(lab, draft.slug, dockerImage, skipBuild);
      const prefix = updated ? 'Lab updated' : 'Lab published';
      res.status(updated ? 200 : 201).json({
        message: `${prefix} — ${result.message}`,
        updated,
        lab: stripLabSecrets(lab),
        buildLog: result.buildLog
      });
    } catch (buildErr) {
      return res.status(500).json({
        message: `${updated ? 'Lab updated' : 'Lab saved'} but ${buildErr.message}`,
        updated,
        lab: stripLabSecrets(buildErr.lab || lab),
        buildError: buildErr.buildError
      });
    }
  } catch (err) {
    console.error('Publish lab error:', err);
    res.status(500).json({ message: err.message || 'Failed to publish lab' });
  }
});

async function syncFlagsFromDisk(lab) {
  if (!lab.slug) return lab;
  const dockerfilePath = path.join(LABS_ROOT, lab.slug, 'Dockerfile');
  if (!fs.existsSync(dockerfilePath)) return lab;
  const dockerfile = fs.readFileSync(dockerfilePath, 'utf8');
  const { flag, flags } = resolveLabFlags({
    slug: lab.slug,
    points: lab.points,
    flag: lab.flag,
    files: [{ path: 'Dockerfile', content: dockerfile }]
  });
  lab.flag = flag;
  lab.flags = flags;
  return lab;
}

router.post('/labs/:id/rebuild', async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });
    if (!lab.slug) return res.status(400).json({ message: 'Lab has no slug — cannot rebuild' });

    await syncFlagsFromDisk(lab);
    lab.buildStatus = 'building';
    lab.buildError = '';
    await lab.save();

    const build = await buildLabImage(lab.slug, lab.dockerImage);
    lab.buildStatus = 'ready';
    lab.isActive = true;
    await lab.save();

    res.json({
      message: 'Docker image rebuilt successfully',
      lab: stripLabSecrets(lab),
      buildLog: build.log?.slice(-2000)
    });
  } catch (err) {
    const lab = await Lab.findById(req.params.id);
    if (lab) {
      lab.buildStatus = 'failed';
      lab.buildError = err.message || 'Rebuild failed';
      await lab.save();
    }
    res.status(500).json({ message: err.message || 'Rebuild failed' });
  }
});

router.put('/labs/:id', async (req, res) => {
  try {
    const allowed = [
      'title', 'description', 'category', 'difficulty', 'points',
      'tasks', 'tools', 'hints', 'hintCosts', 'walkthrough',
      'mitreTags', 'estimatedTime', 'isActive', 'flag', 'flags'
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const lab = await Lab.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!lab) return res.status(404).json({ message: 'Lab not found' });
    res.json({ lab: stripLabSecrets(lab) });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Update failed' });
  }
});

router.delete('/labs/:id', async (req, res) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    if (lab.slug) {
      await removeLabFiles(lab.slug).catch(() => {});
    }
    if (lab.dockerImage) {
      await removeDockerImage(lab.dockerImage);
    }

    await Lab.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lab deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Delete failed' });
  }
});

function stripLabSecrets(lab) {
  const obj = lab.toObject ? lab.toObject() : { ...lab };
  delete obj.flag;
  if (obj.flags) {
    obj.flags = obj.flags.map(({ key, label, points, order }) => ({ key, label, points, order }));
  }
  return obj;
}

module.exports = router;
