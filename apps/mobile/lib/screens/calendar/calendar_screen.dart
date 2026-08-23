import 'package:flutter/material.dart';

import '../../widgets/coming_soon_screen.dart';

class CalendarScreen extends StatelessWidget {
  const CalendarScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ComingSoonScreen(
      title: 'Calendário',
      icon: Icons.calendar_month_outlined,
      description:
          'Grade mensal com seus lançamentos por dia — igual ao web.\n'
          'Chegando em breve.',
    );
  }
}
