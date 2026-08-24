import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('pt_BR', null);
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
