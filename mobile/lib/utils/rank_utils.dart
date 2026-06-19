class RankInfo {
  final String title;
  final String icon;
  final int min;
  final String colorHex;

  const RankInfo({required this.title, required this.icon, required this.min, required this.colorHex});
}

const ranks = [
  RankInfo(title: 'Newbie', icon: '🔰', min: 0, colorHex: '#8b949e'),
  RankInfo(title: 'Script Kiddie', icon: '💻', min: 200, colorHex: '#3fb950'),
  RankInfo(title: 'Hacker', icon: '🔓', min: 500, colorHex: '#58a6ff'),
  RankInfo(title: 'Elite', icon: '⚡', min: 1000, colorHex: '#f0c040'),
  RankInfo(title: 'Legend', icon: '🏆', min: 2000, colorHex: '#f85149'),
];

RankInfo getRank(int xp) {
  for (var i = ranks.length - 1; i >= 0; i--) {
    if (xp >= ranks[i].min) return ranks[i];
  }
  return ranks.first;
}

RankInfo? getNextRank(int xp) {
  for (final r in ranks) {
    if (xp < r.min) return r;
  }
  return null;
}

int getRankProgress(int xp) {
  final current = getRank(xp);
  final next = getNextRank(xp);
  if (next == null) return 100;
  return ((xp - current.min) / (next.min - current.min) * 100).round().clamp(0, 100);
}
