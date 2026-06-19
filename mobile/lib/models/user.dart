class User {
  final String id;
  final String username;
  final String email;
  final int points;
  final int level;
  final int xp;
  final String role;
  final int dailyStreak;
  final List<dynamic> solvedChallenges;
  final List<dynamic> badges;
  final List<String> completedModules;

  const User({
    required this.id,
    required this.username,
    required this.email,
    required this.points,
    required this.level,
    required this.xp,
    required this.role,
    this.dailyStreak = 0,
    this.solvedChallenges = const [],
    this.badges = const [],
    this.completedModules = const [],
  });

  factory User.fromJson(Map<String, dynamic> json) {
    final id = json['_id']?.toString() ?? json['id']?.toString() ?? '';
    return User(
      id: id,
      username: json['username']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      points: (json['points'] as num?)?.toInt() ?? 0,
      level: (json['level'] as num?)?.toInt() ?? 1,
      xp: (json['xp'] as num?)?.toInt() ?? 0,
      role: json['role']?.toString() ?? 'user',
      dailyStreak: (json['dailyStreak'] as num?)?.toInt() ?? 0,
      solvedChallenges: json['solvedChallenges'] as List<dynamic>? ?? [],
      badges: json['badges'] as List<dynamic>? ?? [],
      completedModules: (json['completedModules'] as List<dynamic>? ?? [])
          .map((e) => e.toString())
          .toList(),
    );
  }

  bool isModuleCompleted(String moduleId) => completedModules.contains(moduleId);

  Map<String, dynamic> toJson() => {
        'id': id,
        'username': username,
        'email': email,
        'points': points,
        'level': level,
        'xp': xp,
        'role': role,
        'dailyStreak': dailyStreak,
        'solvedChallenges': solvedChallenges,
        'badges': badges,
      };

  bool isChallengeSolved(String challengeId) {
    return solvedChallenges.any((s) {
      if (s is String) return s == challengeId;
      if (s is Map) return s['_id']?.toString() == challengeId;
      return false;
    });
  }
}
