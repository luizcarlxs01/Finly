/// Espelha apps/web/src/types/profile.ts — perfil financeiro do modo API.
/// Toda chamada da API que opera sobre dados exige o financialProfileId,
/// então este modelo é o elo que faltava para o app falar com a API de
/// verdade (não só autenticar).
class Profile {
  final String id;
  final String name;
  final String? description;
  final double initialBalance;
  final bool isPrimary;
  final String createdAt;

  const Profile({
    required this.id,
    required this.name,
    required this.description,
    required this.initialBalance,
    required this.isPrimary,
    required this.createdAt,
  });

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      initialBalance: (json['initialBalance'] as num?)?.toDouble() ?? 0,
      isPrimary: json['isPrimary'] as bool? ?? false,
      createdAt: json['createdAt'] as String,
    );
  }
}
