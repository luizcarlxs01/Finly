import 'spending_profile.dart';

/// Espelha ProfileResponseDto / apps/web/src/types/profile.ts.
class Profile {
  Profile({
    required this.id,
    required this.name,
    required this.description,
    required this.initialBalance,
    required this.isPrimary,
    required this.spendingProfile,
    required this.customOkThreshold,
    required this.customGoodThreshold,
  });

  final String id;
  final String name;
  final String? description;
  final double initialBalance;
  final bool isPrimary;
  final SpendingProfileId spendingProfile;
  final double? customOkThreshold;
  final double? customGoodThreshold;

  factory Profile.fromJson(Map<String, dynamic> json) => Profile(
        id: json['id'] as String,
        name: json['name'] as String? ?? '',
        description: json['description'] as String?,
        initialBalance: (json['initialBalance'] as num?)?.toDouble() ?? 0,
        isPrimary: json['isPrimary'] as bool? ?? false,
        spendingProfile: SpendingProfileId.fromApi(json['spendingProfile'] as String?),
        customOkThreshold: (json['customOkThreshold'] as num?)?.toDouble(),
        customGoodThreshold: (json['customGoodThreshold'] as num?)?.toDouble(),
      );

  SpendingProfileSettings get spendingProfileSettings => SpendingProfileSettings(
        id: spendingProfile,
        customOkThreshold: customOkThreshold,
        customGoodThreshold: customGoodThreshold,
      );

  /// getSelectedProfile do web: primário, senão o primeiro.
  static Profile? select(List<Profile> profiles) {
    for (final p in profiles) {
      if (p.isPrimary) return p;
    }
    return profiles.isNotEmpty ? profiles.first : null;
  }
}
