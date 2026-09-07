import 'package:flutter/material.dart';

import '../../../app/theme.dart';
import '../data/password_strength.dart';

/// Espelha apps/web/src/components/auth/password-strength-bar.tsx — só aparece
/// com input; barra 1/3 / 2/3 / cheia; vermelho / amarelo / verde; rótulo
/// "Senha fraca/média/forte".
class PasswordStrengthBar extends StatelessWidget {
  const PasswordStrengthBar({super.key, required this.password});

  final String password;

  @override
  Widget build(BuildContext context) {
    if (password.isEmpty) return const SizedBox.shrink();

    final strength = getPasswordStrength(password);
    final color = strength.color(context);

    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: strength.fraction,
              minHeight: 6,
              backgroundColor: context.scheme.outline.withValues(alpha: 0.6),
              valueColor: AlwaysStoppedAnimation(color),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            strength.label,
            style: TextStyle(fontSize: 12, color: context.mutedForeground),
          ),
        ],
      ),
    );
  }
}
