/// Espelha ProfileResponseDto / apps/web/src/types/profile.ts.
class Profile {
  Profile({
    required this.id,
    required this.name,
    required this.description,
    required this.initialBalance,
    required this.isPrimary,
  });

  final String id;
  final String name;
  final String? description;
  final double initialBalance;
  final bool isPrimary;

  factory Profile.fromJson(Map<String, dynamic> json) => Profile(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        description: json['description'] as String?,
        initialBalance: (json['initialBalance'] as num?)?.toDouble() ?? 0,
        isPrimary: json['isPrimary'] as bool? ?? false,
      );

  /// getSelectedProfile do web: primário, senão o primeiro.
  static Profile? select(List<Profile> profiles) {
    for (final p in profiles) {
      if (p.isPrimary) return p;
    }
    return profiles.isNotEmpty ? profiles.first : null;
  }
}
