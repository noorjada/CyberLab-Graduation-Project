const User = require('../models/User');

const EXAM_LOCK_MESSAGE =
  'AI assistance is disabled while you have an active practice exam. Finish or exit the exam to use CyberBot again.';

async function getActiveExamSession(userId) {
  const user = await User.findById(userId).select('activeExamSession').populate('activeExamSession.exam', 'title slug icon');
  if (!user?.activeExamSession?.exam) return null;

  const { exam, startedAt, expiresAt, focusWarnings } = user.activeExamSession;
  if (expiresAt && new Date(expiresAt) < new Date()) {
    await clearExamSession(userId);
    return null;
  }

  return {
    examId: exam._id?.toString() || exam.toString(),
    title: exam.title,
    slug: exam.slug,
    icon: exam.icon,
    startedAt,
    expiresAt,
    focusWarnings: focusWarnings || 0
  };
}

async function startExamSession(userId, exam) {
  const durationMs = (exam.durationMinutes || 60) * 60 * 1000;
  const bufferMs = 15 * 60 * 1000;
  const expiresAt = new Date(Date.now() + durationMs + bufferMs);

  await User.findByIdAndUpdate(userId, {
    activeExamSession: {
      exam: exam._id,
      startedAt: new Date(),
      expiresAt,
      focusWarnings: 0
    }
  });

  return { startedAt: new Date(), expiresAt, focusWarnings: 0 };
}

async function clearExamSession(userId) {
  await User.findByIdAndUpdate(userId, { $unset: { activeExamSession: 1 } });
}

async function recordFocusWarning(userId) {
  const user = await User.findById(userId).select('activeExamSession');
  if (!user?.activeExamSession?.exam) return 0;
  const count = (user.activeExamSession.focusWarnings || 0) + 1;
  user.activeExamSession.focusWarnings = count;
  await user.save();
  return count;
}

async function assertNotInExam(userId) {
  const session = await getActiveExamSession(userId);
  if (session) {
    const err = new Error(EXAM_LOCK_MESSAGE);
    err.code = 'EXAM_IN_PROGRESS';
    err.status = 403;
    err.session = session;
    throw err;
  }
}

module.exports = {
  EXAM_LOCK_MESSAGE,
  getActiveExamSession,
  startExamSession,
  clearExamSession,
  recordFocusWarning,
  assertNotInExam
};
