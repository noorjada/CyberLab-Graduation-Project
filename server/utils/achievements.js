const Notification = require('../models/Notification');

const ACHIEVEMENT_DEFS = [
  { id: 'first_blood',    name: 'First Blood',      icon: '🩸', description: 'Solved your first challenge',         check: u => u.solvedChallenges.length >= 1  },
  { id: 'ctf_warrior',    name: 'CTF Warrior',       icon: '⚔️', description: 'Solved 10 challenges',              check: u => u.solvedChallenges.length >= 10 },
  { id: 'flag_hunter',    name: 'Flag Hunter',       icon: '🚩', description: 'Solved 25 challenges',              check: u => u.solvedChallenges.length >= 25 },
  { id: 'lab_rookie',     name: 'Lab Rookie',        icon: '🖥️', description: 'Completed your first hacking lab',  check: u => (u.completedLabs || 0) >= 1    },
  { id: 'lab_expert',     name: 'Lab Expert',        icon: '💻', description: 'Completed 5 hacking labs',          check: u => (u.completedLabs || 0) >= 5    },
  { id: 'path_finder',    name: 'Path Finder',       icon: '🗺️', description: 'Completed a full learning path',   check: u => (u.completedPaths || 0) >= 1   },
  { id: 'week_warrior',   name: 'Week Warrior',      icon: '🔥', description: 'Maintained a 7-day streak',         check: u => u.dailyStreak >= 7             },
  { id: 'elite_hacker',   name: 'Elite Hacker',      icon: '⚡', description: 'Reached 1000 XP',                  check: u => u.xp >= 1000                   },
  { id: 'legend',         name: 'Legend',            icon: '🏆', description: 'Reached 2000 XP — you are a Legend',check: u => u.xp >= 2000                   },
  { id: 'cert_holder',    name: 'Certified',         icon: '📜', description: 'Earned your first certificate',     check: u => (u.completedPaths || 0) >= 1   },
];

async function checkAndAward(user) {
  const existing = new Set(user.achievements.map(a => a.name));
  const newOnes  = [];

  for (const def of ACHIEVEMENT_DEFS) {
    if (!existing.has(def.name) && def.check(user)) {
      user.achievements.push({ name: def.name, description: def.description, icon: def.icon });
      newOnes.push(def);
    }
  }

  if (newOnes.length > 0) {
    await Promise.all(newOnes.map(a =>
      Notification.create({
        user:    user._id,
        title:   `${a.icon} Achievement Unlocked!`,
        message: `You earned "${a.name}": ${a.description}`,
        type:    'badge',
        icon:    a.icon,
        link:    '/profile'
      }).catch(() => {})
    ));
  }

  return newOnes;
}

module.exports = { checkAndAward, ACHIEVEMENT_DEFS };
