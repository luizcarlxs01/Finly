import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'add_transaction_sheet.dart';
import 'app_bottom_nav.dart';

/// Casca comum às 4 abas principais (Início, Extrato, Metas, Análise).
/// StatefulShellRoute preserva o estado de cada aba ao trocar entre elas
/// (scroll, filtros abertos etc.) — igual ao comportamento esperado de um
/// bottom nav nativo.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      body: navigationShell,
      bottomNavigationBar: AppBottomNav(
        currentIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) => navigationShell.goBranch(
          index,
          initialLocation: index == navigationShell.currentIndex,
        ),
        onAddTap: () => showAddTransactionSheet(context),
      ),
    );
  }
}
