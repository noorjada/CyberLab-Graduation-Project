const express = require('express');

const Lab = require('../models/Lab');

const LabSession = require('../models/LabSession');

const LabProgress = require('../models/LabProgress');

const User = require('../models/User');

const auth = require('../middleware/auth');

const { startLabContainer, stopLabContainer, execInContainer } = require('../utils/docker');

const { checkAndAward } = require('../utils/achievements');

const { updateLevel } = require('../utils/progression');

const requireVerified = require('../middleware/requireVerified');

const { logActivity } = require('../utils/activity');
const { recordDailyActive } = require('../utils/recordDailyActive');
const { recordLabAttendance } = require('../utils/attendance');
const { getLearningObjectives } = require('../data/learningObjectives');

const rateLimit = require('express-rate-limit');

const {

  getLabFlags,

  getPublicFlags,

  getOrCreateProgress,

  accumulateSessionTime,

  formatProgress,

  formatSessionTimer,

  difficultyStars

} = require('../utils/labHelpers');

const { syncProgressAfterFlag, stopRunningSession } = require('../utils/labTracking');



const router = express.Router();



const labLimiter = rateLimit({

  windowMs: 60 * 1000,

  max: 10,

  message: { message: 'Too many requests' }

});



const stripSecrets = (lab) => {

  const obj = lab.toObject ? lab.toObject() : { ...lab };

  delete obj.flag;

  if (obj.flags) {

    obj.flags = getPublicFlags(obj);

  }

  obj.difficultyStars = difficultyStars(obj.difficulty);

  return obj;

};



const startContainerForSession = async (lab, session) => {

  const { containerId, httpPort, sshPort } = await startLabContainer(

    lab.dockerImage,

    session._id.toString()

  );

  session.containerId = containerId;

  session.containerPort = httpPort;

  session.status = 'running';

  session.startedAt = new Date();

  session.expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

  await session.save();



  const progress = await getOrCreateProgress(session.user, session.lab);

  progress.lastStartedAt = session.startedAt;

  await progress.save();



  return { containerId, httpPort, sshPort };

};



// Get all labs

router.get('/', auth, async (req, res) => {

  try {

    const labs = await Lab.find({ isActive: true }).select('-flag -flags.flag');

    const progressList = await LabProgress.find({ user: req.user.userId });

    const progressMap = Object.fromEntries(

      progressList.map(p => [p.lab.toString(), p])

    );



    const labsWithStatus = labs.map(lab => {

      const progress = progressMap[lab._id.toString()];

      const labObj = stripSecrets(lab);

      return {

        ...labObj,

        completed: progress?.completed || lab.completedBy.includes(req.user.userId),

        totalCompletions: lab.completedBy.length,

        ...formatProgress(lab, progress)

      };

    });



    res.json(labsWithStatus);

  } catch (err) {

    console.error(err);

    res.status(500).json({ message: 'Server error' });

  }

});



// Get single lab

router.get('/:id', auth, async (req, res) => {

  try {

    const lab = await Lab.findById(req.params.id).select('-flag -flags.flag');

    if (!lab) return res.status(404).json({ message: 'Lab not found' });



    const progress = await LabProgress.findOne({

      user: req.user.userId,

      lab: req.params.id

    });



    res.json({

      ...stripSecrets(lab),

      flags: getPublicFlags(lab),

      hintCount: lab.hints?.length || 0,

      ...formatProgress(lab, progress)

    });

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});



// Get user progress on a lab

router.get('/:id/progress', auth, async (req, res) => {

  try {

    const lab = await Lab.findById(req.params.id);

    if (!lab) return res.status(404).json({ message: 'Lab not found' });



    const progress = await getOrCreateProgress(req.user.userId, req.params.id);

    res.json(formatProgress(lab, progress));

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});



// Start a lab session

router.post('/:id/start', auth, labLimiter, async (req, res) => {

  try {

    const lab = await Lab.findById(req.params.id);

    if (!lab) return res.status(404).json({ message: 'Lab not found' });



    const existingSession = await LabSession.findOne({

      user: req.user.userId,

      lab: req.params.id,

      status: 'running'

    });



    if (existingSession) {

      const progress = await LabProgress.findOne({

        user: req.user.userId,

        lab: req.params.id

      });

      return res.json({

        message: 'Lab already running',

        session: {

          id: existingSession._id,

          status: existingSession.status,

          containerId: existingSession.containerId,

          httpPort: existingSession.containerPort,

          expiresAt: existingSession.expiresAt,

          solvedFlagKeys: existingSession.solvedFlagKeys || [],

          resetCount: existingSession.resetCount || 0

        },

        timer: formatSessionTimer(existingSession, progress)

      });

    }



    const progress = await getOrCreateProgress(req.user.userId, req.params.id);



    const session = new LabSession({

      user: req.user.userId,

      lab: req.params.id,

      status: 'starting',

      solvedFlagKeys: progress.solvedFlagKeys || []

    });

    await session.save();



    try {

      const { containerId, httpPort, sshPort } = await startContainerForSession(lab, session);

      recordDailyActive(req.user.userId);
      recordLabAttendance(req.user.userId, req.params.id);

      res.json({

        message: 'Lab started successfully!',

        session: {

          id: session._id,

          status: session.status,

          containerId,

          httpPort,

          sshPort,

          expiresAt: session.expiresAt,

          solvedFlagKeys: session.solvedFlagKeys,

          resetCount: session.resetCount

        },

        timer: formatSessionTimer(session, progress),

        progress: formatProgress(lab, progress)

      });

    } catch (dockerErr) {

      session.status = 'error';

      await session.save();

      console.error('Docker error:', dockerErr);

      res.status(500).json({ message: 'Failed to start lab container' });

    }

  } catch (err) {

    console.error(err);

    res.status(500).json({ message: 'Server error' });

  }

});



// Reset lab — tear down container and start fresh (progress flags persist)

router.post('/:id/reset', auth, labLimiter, async (req, res) => {

  try {

    const lab = await Lab.findById(req.params.id);

    if (!lab) return res.status(404).json({ message: 'Lab not found' });



    const progress = await getOrCreateProgress(req.user.userId, req.params.id);



    const existingSession = await LabSession.findOne({

      user: req.user.userId,

      lab: req.params.id,

      status: 'running'

    });



    if (existingSession) {

      await accumulateSessionTime(progress, existingSession);

      if (existingSession.containerId) {

        await stopLabContainer(existingSession.containerId).catch(() => {});

      }

      existingSession.status = 'stopped';

      await existingSession.save();

    }



    const session = new LabSession({

      user: req.user.userId,

      lab: req.params.id,

      status: 'starting',

      solvedFlagKeys: progress.solvedFlagKeys || [],

      resetCount: (existingSession?.resetCount || 0) + 1

    });

    await session.save();



    try {

      const { containerId, httpPort, sshPort } = await startContainerForSession(lab, session);



      res.json({

        message: 'Lab reset — fresh environment ready!',

        session: {

          id: session._id,

          status: session.status,

          containerId,

          httpPort,

          sshPort,

          expiresAt: session.expiresAt,

          solvedFlagKeys: session.solvedFlagKeys,

          resetCount: session.resetCount

        },

        timer: formatSessionTimer(session, progress),

        progress: formatProgress(lab, progress)

      });

    } catch (dockerErr) {

      session.status = 'error';

      await session.save();

      console.error('Docker reset error:', dockerErr);

      res.status(500).json({ message: 'Failed to reset lab container' });

    }

  } catch (err) {

    console.error(err);

    res.status(500).json({ message: 'Server error' });

  }

});



const BLOCKED_COMMAND_PATTERNS = [

  /docker\s/i, /nsenter/i, /chroot/i, /\/proc\/sys/i, /\bmount\s/i,

  /curl\s+.*169\.254/i, /wget\s+.*metadata/i, /capsh/i, /unshare/i

];



const validateLabCommand = (command) => {

  if (!command || typeof command !== 'string') return 'Command required';

  if (command.length > 500) return 'Command too long (max 500 characters)';

  for (const pattern of BLOCKED_COMMAND_PATTERNS) {

    if (pattern.test(command)) return 'Command not allowed in lab environment';

  }

  return null;

};



// Execute command in lab

router.post('/:id/exec', auth, async (req, res) => {

  try {

    const { command } = req.body;

    const validationError = validateLabCommand(command);

    if (validationError) return res.status(400).json({ message: validationError });



    const session = await LabSession.findOne({

      user: req.user.userId,

      lab: req.params.id,

      status: 'running'

    });



    if (!session) {

      return res.status(404).json({ message: 'No active lab session' });

    }



    const output = await execInContainer(session.containerId, command);

    res.json({ output });

  } catch (err) {

    console.error(err);

    res.status(500).json({ message: 'Command failed' });

  }

});



// Reveal lab hint (costs points after first free hint)

router.post('/:id/hint/:index', auth, async (req, res) => {

  try {

    const index = parseInt(req.params.index, 10);

    const lab = await Lab.findById(req.params.id);

    if (!lab) return res.status(404).json({ message: 'Lab not found' });

    if (!lab.hints?.[index]) return res.status(404).json({ message: 'Hint not found' });



    const user = await User.findById(req.user.userId);

    const progress = await getOrCreateProgress(req.user.userId, req.params.id);



    let costPaid = 0;

    if (index >= progress.hintsRevealed) {

      const costs = lab.hintCosts || [0, 15, 30];

      const cost = costs[index] ?? 30;

      if (cost > 0 && user.points < cost) {

        return res.status(400).json({ message: `Need ${cost} points to unlock this hint` });

      }

      if (cost > 0) {

        user.points -= cost;

        costPaid = cost;

      }

      progress.hintsRevealed = index + 1;

      await progress.save();

      await user.save();

    }



    res.json({

      hint: lab.hints[index],

      index,

      costPaid,

      hintsRevealed: progress.hintsRevealed,

      totalPoints: user.points

    });

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});



// Submit flag (supports multiple flags per lab)

router.post('/:id/submit', auth, requireVerified, async (req, res) => {

  try {

    const { flag, flagKey } = req.body;

    if (!flag?.trim()) return res.status(400).json({ message: 'Flag is required' });



    const lab = await Lab.findById(req.params.id);

    if (!lab) return res.status(404).json({ message: 'Lab not found' });



    const flags = getLabFlags(lab);

    const progress = await getOrCreateProgress(req.user.userId, req.params.id);

    const solved = new Set(progress.solvedFlagKeys || []);



    let matched = null;

    if (flagKey) {

      matched = flags.find(f => f.key === flagKey && f.flag === flag.trim());

    } else {

      matched = flags.find(f => f.flag === flag.trim() && !solved.has(f.key));

    }



    if (!matched) {

      return res.status(400).json({ message: 'Wrong flag, keep trying!' });

    }



    if (solved.has(matched.key)) {

      return res.status(400).json({ message: 'You already captured this flag' });

    }



    const user = await User.findById(req.user.userId);

    const pointsEarned = matched.points || Math.floor(lab.points / flags.length);



    solved.add(matched.key);

    progress.solvedFlagKeys = [...solved];

    progress.pointsEarned += pointsEarned;

    user.points += pointsEarned;

    user.xp += pointsEarned * 2;

    updateLevel(user);



    const session = await LabSession.findOne({

      user: req.user.userId,

      lab: req.params.id,

      status: 'running'

    });



    if (session) {

      session.solvedFlagKeys = progress.solvedFlagKeys;

      await session.save();

    }



    const { labCompleted: justCompleted } = syncProgressAfterFlag(lab, progress);
    let labCompleted = justCompleted;
    let sessionStopped = false;

    if (justCompleted) {
      if (!lab.completedBy.includes(req.user.userId)) {
        lab.completedBy.push(req.user.userId);
        await lab.save();
        user.completedLabs = (user.completedLabs || 0) + 1;
      }

      await logActivity(user, 'lab', `completed lab "${lab.title}"`, '🖥️', '/labs');
      recordDailyActive(user._id);

      const stopResult = await stopRunningSession(session, progress);
      sessionStopped = stopResult.stopped;
    }

    await progress.save();

    const newAchievements = await checkAndAward(user);

    await user.save();



    res.json({

      message: labCompleted

        ? '🎉 All flags captured! Lab completed!'

        : `✅ Correct! "${matched.label}" captured!`,

      flagKey: matched.key,

      flagLabel: matched.label,

      pointsEarned,

      totalPoints: user.points,

      labCompleted,

      sessionStopped,

      walkthroughUnlocked: labCompleted,

      progress: formatProgress(lab, progress),

      newAchievements

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({ message: 'Server error' });

  }

});



// Walkthrough — unlocked after all flags are captured

router.get('/:id/walkthrough', auth, async (req, res) => {

  try {

    const lab = await Lab.findById(req.params.id);

    if (!lab) return res.status(404).json({ message: 'Lab not found' });



    const progress = await LabProgress.findOne({

      user: req.user.userId,

      lab: req.params.id

    });



    if (!progress?.completed) {

      const flags = getLabFlags(lab);

      const remaining = flags.length - (progress?.solvedFlagKeys?.length || 0);

      return res.status(403).json({

        message: `Capture all flags to unlock the walkthrough (${remaining} remaining)`,

        flagsSolved: progress?.solvedFlagKeys?.length || 0,

        flagsTotal: flags.length

      });

    }



    if (!lab.walkthrough?.content && !lab.walkthrough?.steps?.length) {

      return res.status(404).json({ message: 'No walkthrough available for this lab' });

    }



    res.json(lab.walkthrough);

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});



// Stop lab

router.post('/:id/stop', auth, async (req, res) => {

  try {

    const session = await LabSession.findOne({

      user: req.user.userId,

      lab: req.params.id,

      status: 'running'

    });



    if (!session) {

      return res.status(404).json({ message: 'No active session' });

    }



    const progress = await getOrCreateProgress(req.user.userId, req.params.id);

    await accumulateSessionTime(progress, session);



    if (session.containerId) {

      await stopLabContainer(session.containerId).catch(() => {});

    }



    session.status = 'stopped';

    await session.save();



    res.json({

      message: 'Lab stopped successfully',

      totalActiveSeconds: progress.totalActiveSeconds

    });

  } catch (err) {

    console.error(err);

    res.status(500).json({ message: 'Server error' });

  }

});



// Get session status + timer

router.get('/:id/session', auth, async (req, res) => {

  try {

    const session = await LabSession.findOne({

      user: req.user.userId,

      lab: req.params.id

    }).sort({ startedAt: -1 });



    const progress = await LabProgress.findOne({

      user: req.user.userId,

      lab: req.params.id

    });



    if (!session) {

      return res.json({

        status: 'none',

        timer: formatSessionTimer(null, progress),

        progress: progress ? formatProgress(

          await Lab.findById(req.params.id),

          progress

        ) : null

      });

    }



    const lab = await Lab.findById(req.params.id);



    res.json({

      ...session.toObject(),

      httpPort: session.containerPort,

      timer: formatSessionTimer(session, progress),

      progress: lab ? formatProgress(lab, progress) : null

    });

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});



// Create lab (admin only)

router.post('/', auth, async (req, res) => {

  try {

    if (req.user.role !== 'admin') {

      return res.status(403).json({ message: 'Access denied' });

    }



    const body = { ...req.body };
    if (!body.learningObjectives?.length && body.title) {
      body.learningObjectives = getLearningObjectives(body.title, body.category);
    }

    const lab = new Lab(body);

    await lab.save();

    res.status(201).json({ message: 'Lab created', lab });

  } catch (err) {

    console.error(err);

    res.status(500).json({ message: 'Server error' });

  }

});



// Delete lab (admin only)

router.delete('/:id', auth, async (req, res) => {

  try {

    if (req.user.role !== 'admin') {

      return res.status(403).json({ message: 'Access denied' });

    }



    await Lab.findByIdAndDelete(req.params.id);

    res.json({ message: 'Lab deleted' });

  } catch (err) {

    res.status(500).json({ message: 'Server error' });

  }

});



module.exports = router;

