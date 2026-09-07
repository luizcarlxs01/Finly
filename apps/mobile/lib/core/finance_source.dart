import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../features/auth/state/auth_controller.dart';

/// Espelha apps/web/src/contexts/finance-source-context.tsx
/// (`FinanceSourceProvider`): a fonte dos dados é decidida **automaticamente**
/// pela sessão — nunca pelo usuário. Sem sessão válida → `local` (dados neste
/// aparelho, `shared_preferences`); com sessão → `api`.
///
/// Regra absoluta do CLAUDE.md (seção 2): a UI nunca sabe de onde o dado veio.
/// Toda a diferença é resolvida aqui e nos controllers.
enum FinanceSource { local, api }

final financeSourceProvider = Provider<FinanceSource>((ref) {
  final authenticated = ref.watch(authControllerProvider).authenticated;
  return authenticated ? FinanceSource.api : FinanceSource.local;
});
