export const RANKS = [
  { title: 'Newbie',       icon: '🔰', min: 0,    color: '#8b949e' },
  { title: 'Script Kiddie',icon: '💻', min: 200,  color: '#3fb950' },
  { title: 'Hacker',       icon: '🔓', min: 500,  color: '#58a6ff' },
  { title: 'Elite',        icon: '⚡', min: 1000, color: '#f0c040' },
  { title: 'Legend',       icon: '🏆', min: 2000, color: '#f85149' },
];

export function getRank(xp = 0) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

export function getNextRank(xp = 0) {
  for (let i = 0; i < RANKS.length; i++) {
    if (xp < RANKS[i].min) return RANKS[i];
  }
  return null;
}

export function getRankProgress(xp = 0) {
  const current = getRank(xp);
  const next    = getNextRank(xp);
  if (!next) return 100;
  return Math.round(((xp - current.min) / (next.min - current.min)) * 100);
}
