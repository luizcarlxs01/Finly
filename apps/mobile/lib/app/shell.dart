import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Casca das 4 abas — adaptação de plataforma do AppFloatingHeader do web
/// (PASSO 8 do briefing: bottom nav é o padrão mobile idiomático). O ícone de
/// conta fica no `AppBar` de cada tela, acessível de qualquer lugar.
class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.shell});

  final StatefulNavigationShell shell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: shell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: shell.currentIndex,
        onDestinationSelected: (index) => shell.goBranch(
          index,
          initialLocation: index == shell.currentIndex,
        ),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home_rounded),
            label: 'Início',
          ),
          NavigationDestination(
            icon: Icon(Icons.account_balance_wallet_outlined),
            selectedIcon: Icon(Icons.account_balance_wallet_rounded),
            label: 'Lançamentos',
          ),
          NavigationDestination(
            icon: Icon(Icons.flag_outlined),
            selectedIcon: Icon(Icons.flag_rounded),
            label: 'Metas',
          ),
          NavigationDestination(
            icon: Icon(Icons.lightbulb_outline),
            selectedIcon: Icon(Icons.lightbulb_rounded),
            label: 'Insights',
          ),
        ],
      ),
    );
  }
}

/// AppBar padrão das telas de aba — título + botão de conta (equivale ao ícone
/// `User` do header do web) + toggle de tema.
class FinlyAppBar extends StatelessWidget implements PreferredSizeWidget {
  const FinlyAppBar({super.key, required this.title, this.themeToggle});

  final String title;
  final Widget? themeToggle;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(title,
          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18)),
      actions: [
        if (themeToggle != null) themeToggle!,
        IconButton(
          tooltip: 'Conta',
          icon: const Icon(Icons.person_outline),
          onPressed: () => context.push('/account'),
        ),
        const SizedBox(width: 4),
      ],
    );
  }
}
