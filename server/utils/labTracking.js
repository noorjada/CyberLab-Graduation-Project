const { getLabFlags, accumulateSessionTime } = require('./labHelpers');
const { stopLabContainer } = require('./docker');

/**
 * Map captured flags → completed task indexes.
 * Multi-flag: flag i completes task i. Single flag: all tasks complete together.
 */
function computeCompletedTaskIndexes(lab, solvedFlagKeys = []) {
  const tasks = lab.tasks || [];
  if (!tasks.length) return [];

  const flags = getLabFlags(lab);
  const solved = new Set(solvedFlagKeys);
  const completed = new Set();

  if (flags.length <= 1) {
    const mainKey = flags[0]?.key || 'main';
    if (solved.has(mainKey)) {
      tasks.forEach((_, i) => completed.add(i));
    }
    return [...completed].sort((a, b) => a - b);
  }

  flags.forEach((flag, i) => {
    if (solved.has(flag.key)) {
      completed.add(Math.min(i, tasks.length - 1));
    }
  });

  return [...completed].sort((a, b) => a - b);
}

function buildTaskStatus(lab, progress) {
  const tasks = lab.tasks || [];
  const completedIndexes = new Set(
    progress?.completedTaskIndexes?.length
      ? progress.completedTaskIndexes
      : computeCompletedTaskIndexes(lab, progress?.solvedFlagKeys || [])
  );

  return tasks.map((task, index) => ({
    index,
    title: task.title,
    description: task.description,
    points: task.points || 0,
    done: completedIndexes.has(index)
  }));
}

function buildFlagStatus(lab, progress) {
  const flags = getLabFlags(lab);
  const solved = new Set(progress?.solvedFlagKeys || []);

  return flags.map(flag => ({
    key: flag.key,
    label: flag.label,
    points: flag.points,
    done: solved.has(flag.key)
  }));
}

function formatLabTracking(lab, progress) {
  const flags = getLabFlags(lab);
  const solved = progress?.solvedFlagKeys || [];
  const flagsTotal = flags.length;
  const flagsSolved = solved.length;
  const taskStatus = buildTaskStatus(lab, progress);
  const flagStatus = buildFlagStatus(lab, progress);
  const tasksCompleted = taskStatus.filter(t => t.done).length;
  const tasksTotal = taskStatus.length;
  const allFlagsDone = flags.every(f => solved.includes(f.key));
  const allTasksDone = tasksTotal === 0 || tasksCompleted === tasksTotal;
  const isComplete = progress?.completed || (allFlagsDone && allTasksDone);

  return {
    solvedFlagKeys: solved,
    flagsSolved,
    flagsTotal,
    flagStatus,
    tasksCompleted,
    tasksTotal,
    taskStatus,
    completedTaskIndexes: progress?.completedTaskIndexes || computeCompletedTaskIndexes(lab, solved),
    progressPercent: flagsTotal ? Math.round((flagsSolved / flagsTotal) * 100) : 0,
    hintsRevealed: progress?.hintsRevealed || 0,
    pointsEarned: progress?.pointsEarned || 0,
    completed: isComplete,
    completedAt: progress?.completedAt,
    totalActiveSeconds: progress?.totalActiveSeconds || 0,
    allRequirementsMet: allFlagsDone && allTasksDone
  };
}

async function stopRunningSession(session, progress) {
  if (!session || session.status !== 'running') {
    return { stopped: false, totalActiveSeconds: progress?.totalActiveSeconds || 0 };
  }

  if (progress) {
    await accumulateSessionTime(progress, session);
  }

  if (session.containerId) {
    await stopLabContainer(session.containerId).catch(() => {});
  }

  session.status = 'stopped';
  session.flagSubmitted = true;
  session.completedAt = new Date();
  await session.save();

  return {
    stopped: true,
    totalActiveSeconds: progress?.totalActiveSeconds || 0
  };
}

function syncProgressAfterFlag(lab, progress) {
  progress.completedTaskIndexes = computeCompletedTaskIndexes(lab, progress.solvedFlagKeys);
  const tracking = formatLabTracking(lab, progress);
  const flags = getLabFlags(lab);
  const allFlagsDone = flags.every(f => progress.solvedFlagKeys.includes(f.key));

  if (allFlagsDone && tracking.allRequirementsMet && !progress.completed) {
    progress.completed = true;
    progress.completedAt = new Date();
    return { labCompleted: true };
  }

  return { labCompleted: progress.completed };
}

module.exports = {
  computeCompletedTaskIndexes,
  buildTaskStatus,
  buildFlagStatus,
  formatLabTracking,
  stopRunningSession,
  syncProgressAfterFlag
};
