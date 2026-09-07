import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme.dart';
import '../../auth/state/auth_controller.dart';

/// Tela de carregamento animada com a logo do Finly, mostrada até o app estar
/// pronto (leitura da sessão do secure storage). Faz a ponte entre a splash
/// nativa (imagem estática) e a Home, sem flash de tela branca.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  late final AnimationController _intro = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 900),
  )..forward();

  late final AnimationController _loop = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat();

  late final Animation<double> _fade = CurvedAnimation(
    parent: _intro,
    curve: const Interval(0.0, 0.55, curve: Curves.easeOut),
  );
  late final Animation<double> _scale = CurvedAnimation(
    parent: _intro,
    curve: Curves.easeOutBack,
  );
  late final Animation<double> _wordmark = CurvedAnimation(
    parent: _intro,
    curve: const Interval(0.45, 1.0, curve: Curves.easeOut),
  );

  @override
  void initState() {
    super.initState();
    _goHomeWhenReady();
  }

  Future<void> _goHomeWhenReady() async {
    // Tempo mínimo de exibição para a animação não piscar.
    await Future<void>.delayed(const Duration(milliseconds: 1300));
    // Espera o bootstrap da sessão terminar (leitura do secure storage), com
    // teto de segurança para nunca travar aqui.
    final deadline = DateTime.now().add(const Duration(seconds: 4));
    while (ref.read(authControllerProvider).isBootstrapping &&
        DateTime.now().isBefore(deadline)) {
      await Future<void>.delayed(const Duration(milliseconds: 60));
    }
    if (mounted) context.go('/home');
  }

  @override
  void dispose() {
    _intro.dispose();
    _loop.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF05204C), Color(0xFF031533), Color(0xFF031533)],
            stops: [0.0, 0.42, 1.0],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedBuilder(
                animation: Listenable.merge([_intro, _loop]),
                builder: (context, _) {
                  final breathe =
                      1 + 0.035 * math.sin(_loop.value * 2 * math.pi);
                  return Opacity(
                    opacity: _fade.value.clamp(0.0, 1.0),
                    child: Transform.scale(
                      scale: (0.72 + 0.28 * _scale.value.clamp(0.0, 1.2)) *
                          breathe,
                      child: SizedBox(
                        width: 132,
                        height: 132,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            CustomPaint(
                              size: const Size(132, 132),
                              painter: _ArcPainter(
                                progress: _loop.value,
                                color: AppColors.primaryDark,
                              ),
                            ),
                            const Padding(
                              padding: EdgeInsets.all(20),
                              child: Image(
                                image: AssetImage('assets/finly_logo.png'),
                                filterQuality: FilterQuality.high,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
              const SizedBox(height: 22),
              FadeTransition(
                opacity: _wordmark,
                child: const Text(
                  'Finly',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              FadeTransition(
                opacity: _wordmark,
                child: Text(
                  'Seu financeiro mais claro',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.55),
                    fontSize: 12.5,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Arco fino girando ao redor da logo — indicador de carregamento discreto.
class _ArcPainter extends CustomPainter {
  _ArcPainter({required this.progress, required this.color});

  final double progress;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final center = size.center(Offset.zero);
    final radius = size.width / 2 - 3;
    final rect = Rect.fromCircle(center: center, radius: radius);

    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..color = color.withValues(alpha: 0.14);
    canvas.drawCircle(center, radius, track);

    final sweep = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round
      ..shader = SweepGradient(
        colors: [color.withValues(alpha: 0.0), color],
        startAngle: 0,
        endAngle: math.pi * 1.4,
        transform: GradientRotation(progress * 2 * math.pi),
      ).createShader(rect);

    canvas.drawArc(
      rect,
      progress * 2 * math.pi,
      math.pi * 1.4,
      false,
      sweep,
    );
  }

  @override
  bool shouldRepaint(_ArcPainter old) => old.progress != progress;
}
