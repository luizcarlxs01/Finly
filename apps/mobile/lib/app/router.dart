import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/auth/ui/account_screen.dart';
import '../features/calendar/ui/calendar_screen.dart';
import '../features/goals/ui/goals_screen.dart';
import '../features/home/ui/home_screen.dart';
import '../features/insights/ui/insights_screen.dart';
import '../features/transactions/ui/statement_screen.dart';
import '../features/transactions/ui/transactions_screen.dart';
import 'shell.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();

/// O app é **sempre acessível**, com ou sem conta (modo sem conta = dados neste
/// aparelho). Entrar/criar conta é opcional, pelo ícone de conta → `/account`.
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/home',
    redirect: (context, state) {
      // Rota legada — o acesso à conta agora vive dentro de /account.
      if (state.matchedLocation == '/auth') return '/account';
      return null;
    },
    routes: [
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/account',
        builder: (_, __) => const AccountScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/calendar',
        builder: (_, __) => const CalendarScreen(),
      ),
      GoRoute(
        parentNavigatorKey: _rootNavigatorKey,
        path: '/statement',
        builder: (_, __) => const StatementScreen(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (_, __, shell) => AppShell(shell: shell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/transactions',
                builder: (_, __) => const TransactionsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/goals', builder: (_, __) => const GoalsScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/insights', builder: (_, __) => const InsightsScreen()),
          ]),
        ],
      ),
    ],
  );
});
