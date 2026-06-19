const User = require('../models/User');
const Challenge = require('../models/Challenge');
const LabProgress = require('../models/LabProgress');
const Activity = require('../models/Activity');
const DailyActiveUser = require('../models/DailyActiveUser');

const DIFFICULTY_WEIGHT = { easy: 1, medium: 2, hard: 3 };

const dayKey = (date) => date.toISOString().slice(0, 10);

const fillDateSeries = (startDate, days, dataMap) => {
  const series = [];
  const cursor = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const key = dayKey(cursor);
    series.push({ date: key, count: dataMap[key] || 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return series;
};

const weekLabel = (date) => {
  const d = new Date(date);
  const start = new Date(d);
  start.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return dayKey(start);
};

const fillWeekSeries = (weeks, weeklyCounts) => {
  const series = [];
  const cursor = new Date();
  cursor.setDate(cursor.getDate() - (weeks - 1) * 7);
  cursor.setHours(0, 0, 0, 0);
  for (let i = 0; i < weeks; i++) {
    const key = weekLabel(cursor);
    const isoYear = cursor.getFullYear();
    const isoWeek = getIsoWeek(cursor);
    const match = weeklyCounts.find(w => w.year === isoYear && w.week === isoWeek);
    series.push({
      week: key,
      label: `W${isoWeek}`,
      count: match?.count || 0
    });
    cursor.setDate(cursor.getDate() + 7);
  }
  return series;
};

const getIsoWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const getMostDifficultChallenge = (challenges, totalUsers) => {
  if (!challenges.length) return null;

  let best = null;
  let bestScore = -1;

  for (const ch of challenges) {
    const solveCount = ch.solvedBy?.length || 0;
    const solveRate = solveCount / Math.max(totalUsers, 1);
    const weight = DIFFICULTY_WEIGHT[ch.difficulty] || 2;
    const difficultyScore = weight / (solveRate + 0.05);

    if (difficultyScore > bestScore) {
      bestScore = difficultyScore;
      best = {
        _id: ch._id,
        title: ch.title,
        category: ch.category,
        difficulty: ch.difficulty,
        points: ch.points,
        solveCount,
        solveRate: Math.round(solveRate * 1000) / 10
      };
    }
  }

  return best;
};

const getMostSolvedChallenge = (challenges) => {
  if (!challenges.length) return null;

  let best = null;
  let maxSolves = -1;

  for (const ch of challenges) {
    const solveCount = ch.solvedBy?.length || 0;
    if (solveCount > maxSolves) {
      maxSolves = solveCount;
      best = {
        _id: ch._id,
        title: ch.title,
        category: ch.category,
        difficulty: ch.difficulty,
        points: ch.points,
        solveCount
      };
    }
  }

  return best?.solveCount > 0 ? best : null;
};

async function getAdminAnalytics() {
  const now = new Date();
  const day24h = new Date(now - 24 * 60 * 60 * 1000);
  const day7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const day30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    challenges,
    activeUsers24h,
    activeUsers7d,
    activeFromActivity7d,
    labCompletionAgg,
    dauFromDaily,
    dauFromActivity,
    userGrowthAgg
  ] = await Promise.all([
    User.countDocuments({ role: { $in: ['user', 'instructor'] } }),
    Challenge.find().select('title category difficulty points solvedBy'),
    User.countDocuments({
      role: { $in: ['user', 'instructor'] },
      $or: [
        { lastLogin: { $gte: day24h } },
        { lastActiveDate: { $gte: day24h } }
      ]
    }),
    User.countDocuments({
      role: { $in: ['user', 'instructor'] },
      $or: [
        { lastLogin: { $gte: day7 } },
        { lastActiveDate: { $gte: day7 } }
      ]
    }),
    Activity.distinct('user', { createdAt: { $gte: day7 } }),
    LabProgress.aggregate([
      { $match: { completed: true, totalActiveSeconds: { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgSeconds: { $avg: '$totalActiveSeconds' },
          count: { $sum: 1 }
        }
      }
    ]),
    DailyActiveUser.aggregate([
      { $match: { date: { $gte: dayKey(day30) } } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]),
    Activity.aggregate([
      { $match: { createdAt: { $gte: day30 } } },
      {
        $group: {
          _id: { date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, user: '$user' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: new Date(now - 12 * 7 * 24 * 60 * 60 * 1000) } } },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } }
    ])
  ]);

  const dauMap = {};
  dauFromActivity.forEach(r => { dauMap[r._id] = r.count; });
  dauFromDaily.forEach(r => {
    dauMap[r._id] = Math.max(dauMap[r._id] || 0, r.count);
  });

  const dailyActiveUsers = fillDateSeries(day30, 30, dauMap);

  const weeklyCounts = userGrowthAgg.map(r => ({
    year: r._id.year,
    week: r._id.week,
    count: r.count
  }));
  const userGrowth = fillWeekSeries(12, weeklyCounts);

  const avgLab = labCompletionAgg[0];
  const avgCompletionSeconds = avgLab ? Math.round(avgLab.avgSeconds) : 0;

  const activityActive7d = activeFromActivity7d.length;
  const activeUsers7dCombined = Math.max(activeUsers7d, activityActive7d);

  return {
    overview: {
      totalUsers,
      activeUsers24h,
      activeUsers7d: activeUsers7dCombined,
      avgCompletionSeconds,
      avgCompletionMinutes: Math.round(avgCompletionSeconds / 60),
      labCompletionsSampled: avgLab?.count || 0
    },
    mostDifficultChallenge: getMostDifficultChallenge(challenges, totalUsers),
    mostSolvedChallenge: getMostSolvedChallenge(challenges),
    dailyActiveUsers,
    userGrowth,
    dauToday: dauMap[dayKey(now)] || 0,
    generatedAt: now.toISOString()
  };
}

module.exports = { getAdminAnalytics };
