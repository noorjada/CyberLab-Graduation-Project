const LabProgress = require('../models/LabProgress');

const DIFFICULTY_STARS = { easy: 2, medium: 3, hard: 5 };

const getLabFlags = (lab) => {
  if (lab.flags?.length) return lab.flags;
  return [{
    key: 'main',
    label: 'Main Flag',
    flag: lab.flag,
    points: lab.points
  }];
};

const getPublicFlags = (lab) =>
  getLabFlags(lab).map(({ key, label, points, order }) => ({
    key,
    label,
    points,
    order
  }));

const getOrCreateProgress = async (userId, labId) => {
  let progress = await LabProgress.findOne({ user: userId, lab: labId });
  if (!progress) {
    progress = await LabProgress.create({ user: userId, lab: labId });
  }
  return progress;
};

const accumulateSessionTime = async (progress, session) => {
  if (!progress || !session?.startedAt) return;
  const elapsed = Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000);
  if (elapsed > 0) {
    progress.totalActiveSeconds += elapsed;
    progress.lastStartedAt = new Date();
    await progress.save();
  }
};

const formatProgress = (lab, progress) => {
  const { formatLabTracking } = require('./labTracking');
  return formatLabTracking(lab, progress);
};

const formatSessionTimer = (session, progress) => {
  if (!session || session.status !== 'running') {
    return {
      status: session?.status || 'none',
      elapsedSeconds: progress?.totalActiveSeconds || 0,
      remainingSeconds: 0,
      expiresAt: session?.expiresAt
    };
  }

  const startedAt = new Date(session.startedAt).getTime();
  const elapsedSeconds =
    (progress?.totalActiveSeconds || 0) + Math.floor((Date.now() - startedAt) / 1000);
  const expiresAt = session.expiresAt ? new Date(session.expiresAt).getTime() : null;
  const remainingSeconds = expiresAt
    ? Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))
    : null;

  return {
    status: session.status,
    elapsedSeconds,
    remainingSeconds,
    expiresAt: session.expiresAt,
    startedAt: session.startedAt,
    resetCount: session.resetCount || 0
  };
};

const difficultyStars = (difficulty) => DIFFICULTY_STARS[difficulty] || 3;

module.exports = {
  getLabFlags,
  getPublicFlags,
  getOrCreateProgress,
  accumulateSessionTime,
  formatProgress,
  formatSessionTimer,
  difficultyStars,
  DIFFICULTY_STARS
};
