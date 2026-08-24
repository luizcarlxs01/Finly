import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/profile.dart';
import 'auth_provider.dart';

Profile? _pickPrimary(List<Profile> profiles) {
  if (profiles.isEmpty) return null;
  for (final profile in profiles) {
    if (profile.isPrimary) return profile;
  }
  return profiles.first;
}

/// Perfil financeiro primário do usuário autenticado — mesma escolha de
/// getSelectedProfile em apps/web/src/hooks/use-finance-data.ts (isPrimary,
/// senão o primeiro). Necessário em toda chamada de API que opera sobre
/// dados (financialProfileId). Recomputa sozinho quando a sessão muda
/// (login/logout), pois observa authProvider inteiro.
final primaryProfileProvider = FutureProvider<Profile?>((ref) async {
  final auth = ref.watch(authProvider);
  if (!auth.isAuthenticated) return null;

  final client = ref.read(apiClientProvider);
  final response = await client.dio.get<List<dynamic>>('/api/profiles');
  final profiles = (response.data ?? [])
      .map((raw) => Profile.fromJson(raw as Map<String, dynamic>))
      .toList();

  return _pickPrimary(profiles);
});
