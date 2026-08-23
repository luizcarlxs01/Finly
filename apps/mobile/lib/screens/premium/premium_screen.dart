import 'package:flutter/material.dart';

import '../../widgets/coming_soon_screen.dart';

class PremiumScreen extends StatelessWidget {
  const PremiumScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ComingSoonScreen(
      title: 'Finly Pro',
      icon: Icons.auto_awesome_outlined,
      description:
          'Projeção ilimitada e regras financeiras automáticas.\n'
          'Chegando em breve.',
    );
  }
}
