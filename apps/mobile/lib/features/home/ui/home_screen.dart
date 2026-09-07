import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/app.dart';
import '../../../app/shell.dart';
import '../../../app/theme.dart';
import '../../../core/widgets/widgets.dart';

/// Espelha apps/web/src/components/dashboard/hero-section.tsx (o conteúdo que o
/// PASSO 3 descreve): título, subtítulo, CTA "Começar lançamentos", 3 cartões
/// de destaque e os atalhos Calendário / Extrato. Sem FAB nesta aba (regra do
/// web).
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: const FinlyAppBar(title: 'Finly', themeToggle: ThemeToggleButton()),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
        children: [
          FinlyCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Seu financeiro mais claro, simples e organizado.',
                  style: TextStyle(
                      fontSize: 24, fontWeight: FontWeight.w700, height: 1.2),
                ),
                const SizedBox(height: 10),
                Text(
                  'Comece pelo essencial e ganhe clareza sobre seu dinheiro.',
                  style:
                      TextStyle(fontSize: 14, color: context.mutedForeground),
                ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => context.go('/transactions'),
                    icon: const Text('Começar lançamentos'),
                    label: const Icon(Icons.arrow_forward, size: 18),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const _FeatureCard(
            title: 'Veja seu momento',
            body: 'Saldo, entradas e saídas num relance.',
          ),
          const SizedBox(height: 10),
          const _FeatureCard(
            title: 'Registre com facilidade',
            body: 'Adicione movimentações sem perder clareza.',
          ),
          const SizedBox(height: 10),
          const _FeatureCard(
            title: 'Acompanhe objetivos',
            body: 'Metas e insights no seu caminho.',
          ),
          const SizedBox(height: 18),
          Text('Atalhos',
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.4,
                  color: context.mutedForeground)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: _Shortcut(
                  icon: Icons.calendar_month_outlined,
                  label: 'Calendário',
                  onTap: () => context.push('/calendar'),
                  filled: true,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _Shortcut(
                  icon: Icons.receipt_long_outlined,
                  label: 'Extrato',
                  onTap: () => context.push('/statement'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FeatureCard extends StatelessWidget {
  const _FeatureCard({required this.title, required this.body});
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return FinlyCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          const SizedBox(height: 4),
          Text(body,
              style:
                  TextStyle(fontSize: 13, color: context.mutedForeground)),
        ],
      ),
    );
  }
}

class _Shortcut extends StatelessWidget {
  const _Shortcut({
    required this.icon,
    required this.label,
    required this.onTap,
    this.filled = false,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool filled;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Material(
      color: filled ? scheme.primary : scheme.surface,
      borderRadius: BorderRadius.circular(AppColors.fieldRadius),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        onTap: onTap,
        child: Container(
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppColors.fieldRadius),
            border: filled ? null : Border.all(color: scheme.outline),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  size: 18,
                  color: filled ? scheme.onPrimary : scheme.onSurface),
              const SizedBox(width: 8),
              Text(label,
                  style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: filled ? scheme.onPrimary : scheme.onSurface)),
            ],
          ),
        ),
      ),
    );
  }
}
