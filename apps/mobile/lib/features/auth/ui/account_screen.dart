import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/app.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/widgets.dart';
import '../state/auth_controller.dart';
import 'account_access_panel.dart';

/// Tela de conta, acessível de qualquer aba pelo ícone de conta.
///  - Sem sessão → aviso "modo sem conta" + painel de entrar/criar conta.
///  - Com sessão → identidade (nome/e-mail) + "Sair".
/// Espelha os dois estados de account-access-card.tsx.
class AccountScreen extends ConsumerWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);
    final session = auth.session;
    final authenticated = auth.authenticated;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Conta'),
        actions: const [ThemeToggleButton(), SizedBox(width: 4)],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (authenticated) ...[
            FinlyCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Modo com conta ativo',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 4),
                  Text(
                    'Seus dados estão sincronizados com a sua conta Finly.',
                    style: TextStyle(
                        fontSize: 12.5, color: context.mutedForeground),
                  ),
                  const SizedBox(height: 16),
                  _Identity(label: 'Nome', value: session?.name ?? '—'),
                  const SizedBox(height: 10),
                  _Identity(label: 'E-mail', value: session?.email ?? '—'),
                  const SizedBox(height: 16),
                  const Divider(),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.logout, size: 18),
                      label: const Text('Sair'),
                      onPressed: () async {
                        await ref
                            .read(authControllerProvider.notifier)
                            .logout();
                        if (context.mounted) Navigator.of(context).maybePop();
                      },
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: context.scheme.surface,
                borderRadius: BorderRadius.circular(AppColors.fieldRadius),
                border: Border.all(color: context.scheme.outline),
              ),
              child: Row(
                children: [
                  Icon(Icons.smartphone_outlined,
                      size: 18, color: context.mutedForeground),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Modo sem conta — seus dados ficam salvos apenas neste aparelho.',
                      style: TextStyle(
                          fontSize: 12.5, color: context.mutedForeground),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const AccountAccessPanel(),
          ],
        ],
      ),
    );
  }
}

class _Identity extends StatelessWidget {
  const _Identity({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: context.scheme.surface,
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        border: Border.all(color: context.scheme.outline),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(),
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.5,
                  color: context.mutedForeground)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(fontSize: 14)),
        ],
      ),
    );
  }
}
