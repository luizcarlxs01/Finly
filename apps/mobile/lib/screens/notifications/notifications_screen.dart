import 'package:flutter/material.dart';

import '../../widgets/coming_soon_screen.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ComingSoonScreen(
      title: 'Notificações',
      icon: Icons.notifications_outlined,
      description:
          'Avisos de vencimento, orçamento estourado e metas\n'
          'próximas do fim. Chegando em breve.',
    );
  }
}
