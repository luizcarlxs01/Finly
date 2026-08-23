import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const ProviderScope(child: FinlyApp()));
}

class FinlyApp extends ConsumerWidget {
  const FinlyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final goRouter = ref.watch(goRouterProvider);

    return MaterialApp.router(
      title: 'Finly',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      routerConfig: goRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}
