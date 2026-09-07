import 'package:flutter/material.dart';

import '../../app/theme.dart';

/// Cartão base — equivalente ao `<Card>` do shadcn usado em todo o web:
/// fundo `surface`, borda 1px `border`, cantos ~20px, sem sombra pesada.
class FinlyCard extends StatelessWidget {
  const FinlyCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.onTap,
    this.borderColor,
    this.background,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final VoidCallback? onTap;
  final Color? borderColor;
  final Color? background;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    final content = Container(
      padding: padding,
      decoration: BoxDecoration(
        color: background ?? scheme.surface,
        borderRadius: BorderRadius.circular(AppColors.cardRadius),
        border: Border.all(color: borderColor ?? scheme.outline),
      ),
      child: child,
    );
    if (onTap == null) return content;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppColors.cardRadius),
      child: content,
    );
  }
}

/// Subtítulo/descrição de seção. O título grande do web foi removido nas
/// telas de aba porque a AppBar (`FinlyAppBar`) já mostra o nome da seção —
/// repetir "Lançamentos / Lançamentos" era redundante no mobile.
class SectionHeader extends StatelessWidget {
  const SectionHeader({super.key, this.title, this.subtitle});

  final String? title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    if (subtitle == null) return const SizedBox.shrink();
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        subtitle!,
        style: TextStyle(fontSize: 13, color: context.mutedForeground),
      ),
    );
  }
}

/// "Chip" arredondado — badges de tipo/categoria/kind das listas do web.
class PillBadge extends StatelessWidget {
  const PillBadge({
    super.key,
    required this.label,
    this.background,
    this.foreground,
    this.leadingDot,
  });

  final String label;
  final Color? background;
  final Color? foreground;
  final Color? leadingDot;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: background ?? scheme.surfaceContainerHighest,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (leadingDot != null) ...[
            Container(
              width: 6,
              height: 6,
              decoration:
                  BoxDecoration(color: leadingDot, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
              color: foreground ?? context.mutedForeground,
            ),
          ),
        ],
      ),
    );
  }
}

/// Painel de mensagem de erro (equivalente ao `writeModeMessage` / caixas
/// `border-destructive/30 bg-destructive/10` do web).
class ErrorBanner extends StatelessWidget {
  const ErrorBanner(this.message, {super.key, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: scheme.error.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(AppColors.fieldRadius),
        border: Border.all(color: scheme.error.withValues(alpha: 0.35)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(message, style: TextStyle(fontSize: 13, color: scheme.error)),
          if (onRetry != null) ...[
            const SizedBox(height: 8),
            TextButton(onPressed: onRetry, child: const Text('Tentar de novo')),
          ],
        ],
      ),
    );
  }
}

/// Estado vazio — cartão tracejado igual às listas do web.
class EmptyState extends StatelessWidget {
  const EmptyState({super.key, required this.title, required this.description});

  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    final scheme = context.scheme;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(AppColors.cardRadius),
        border: Border.all(
          color: scheme.outline,
          style: BorderStyle.solid,
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 13, color: context.mutedForeground),
          ),
        ],
      ),
    );
  }
}

void showErrorSnack(BuildContext context, Object error) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(error.toString())));
}

void showInfoSnack(BuildContext context, String message) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(message)));
}
