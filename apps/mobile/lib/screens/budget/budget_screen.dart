import 'package:flutter/material.dart';

import '../../widgets/coming_soon_screen.dart';

class BudgetScreen extends StatelessWidget {
  const BudgetScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ComingSoonScreen(
      title: 'Orçamento',
      icon: Icons.pie_chart_outline,
      description:
          'Defina limites por categoria e acompanhe o quanto falta\n'
          'até estourar o mês. Chegando em breve.',
    );
  }
}
