import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

class NavDestinationInfo {
  final IconData icon;
  final String label;

  const NavDestinationInfo({required this.icon, required this.label});
}

/// Barra "Tab bar + FAB" do mockup — uma única faixa flutuante com 5
/// posições, onde a do meio (Novo) é maior e colorida, mas continua fazendo
/// parte da mesma linha em vez de ser um FAB docked separado.
class AppBottomNav extends StatelessWidget {
  const AppBottomNav({
    super.key,
    required this.currentIndex,
    required this.onDestinationSelected,
    required this.onAddTap,
  });

  /// Índice entre as 4 abas reais (Início, Extrato, Metas, Análise) — o
  /// botão "Novo" no meio não é uma aba, é uma ação.
  final int currentIndex;
  final ValueChanged<int> onDestinationSelected;
  final VoidCallback onAddTap;

  static const _destinations = [
    NavDestinationInfo(icon: Icons.home_outlined, label: 'Início'),
    NavDestinationInfo(icon: Icons.receipt_long_outlined, label: 'Extrato'),
    NavDestinationInfo(icon: Icons.flag_outlined, label: 'Metas'),
    NavDestinationInfo(icon: Icons.bar_chart_outlined, label: 'Análise'),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(12, 0, 12, 24),
      child: Container(
        height: 66,
        padding: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: AppColors.ink.withValues(alpha: 0.12),
              blurRadius: 30,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Row(
          children: [
            _navItem(0),
            _navItem(1),
            _addButton(),
            _navItem(2),
            _navItem(3),
          ],
        ),
      ),
    );
  }

  Widget _navItem(int index) {
    final info = _destinations[index];
    final active = index == currentIndex;

    return Expanded(
      child: GestureDetector(
        onTap: () => onDestinationSelected(index),
        behavior: HitTestBehavior.opaque,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 34,
              height: 34,
              decoration: BoxDecoration(
                color: active ? AppColors.primarySoft : Colors.transparent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                info.icon,
                size: 19,
                color: active ? AppColors.primary : AppColors.mutedLight,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              info.label,
              style: TextStyle(
                fontSize: 9.5,
                fontWeight: FontWeight.w600,
                color: active ? AppColors.primary : AppColors.mutedLight,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _addButton() {
    return Expanded(
      child: GestureDetector(
        onTap: onAddTap,
        behavior: HitTestBehavior.opaque,
        child: Center(
          child: Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: AppColors.primary.withValues(alpha: 0.45),
                  blurRadius: 16,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(Icons.add, color: Colors.white, size: 22),
          ),
        ),
      ),
    );
  }
}
