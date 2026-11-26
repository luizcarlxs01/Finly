import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../../goals/ui/goal_form_sheet.dart';
import '../../transactions/ui/transaction_form_sheet.dart';

/// FAB speed dial do web (page.tsx): "[+]" gira 45° e revela "Novo lançamento"
/// e "Nova meta". Reutilizável em qualquer aba em que o web mostra o FAB.
class FinlySpeedDial extends StatefulWidget {
  const FinlySpeedDial({super.key});

  @override
  State<FinlySpeedDial> createState() => _FinlySpeedDialState();
}

class _FinlySpeedDialState extends State<FinlySpeedDial> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        AnimatedSize(
          duration: const Duration(milliseconds: 180),
          child: _open
              ? Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    _MiniAction(
                      label: 'Novo lançamento',
                      icon: Icons.swap_vert,
                      onTap: () {
                        setState(() => _open = false);
                        showTransactionFormSheet(context);
                      },
                    ),
                    const SizedBox(height: 10),
                    _MiniAction(
                      label: 'Nova meta',
                      icon: Icons.flag_outlined,
                      onTap: () {
                        setState(() => _open = false);
                        showGoalFormSheet(context);
                      },
                    ),
                    const SizedBox(height: 10),
                  ],
                )
              : const SizedBox.shrink(),
        ),
        FloatingActionButton(
          tooltip: _open ? 'Fechar menu' : 'Novo lançamento',
          onPressed: () => setState(() => _open = !_open),
          child: AnimatedRotation(
            turns: _open ? 0.125 : 0,
            duration: const Duration(milliseconds: 180),
            child: const Icon(Icons.add),
          ),
        ),
      ],
    );
  }
}

class _MiniAction extends StatelessWidget {
  const _MiniAction(
      {required this.label, required this.icon, required this.onTap});
  final String label;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: scheme.outline),
          ),
          child: Text(label,
              style:
                  const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
        ),
        const SizedBox(width: 10),
        FloatingActionButton.small(
          heroTag: 'insights-$label',
          onPressed: onTap,
          backgroundColor: scheme.surface,
          foregroundColor: scheme.onSurface,
          child: Icon(icon),
        ),
      ],
    );
  }
}
