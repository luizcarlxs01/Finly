import 'package:flutter/material.dart';

import '../../../app/theme.dart';

/// Réplica **exata** de apps/web/src/utils/password-strength.ts — mesma
/// pontuação, mesmos limites (0-2 = fraca, 3 = média, 4+ = forte).
enum PasswordStrength { weak, medium, strong }

PasswordStrength getPasswordStrength(String password) {
  if (password.isEmpty) return PasswordStrength.weak;

  var score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (RegExp(r'[a-z]').hasMatch(password) &&
      RegExp(r'[A-Z]').hasMatch(password)) {
    score += 1;
  }
  if (RegExp(r'\d').hasMatch(password)) score += 1;
  if (RegExp(r'[^a-zA-Z0-9]').hasMatch(password)) score += 1;

  if (score <= 2) return PasswordStrength.weak;
  if (score == 3) return PasswordStrength.medium;
  return PasswordStrength.strong;
}

/// Rótulos/cores da barra — password-strength-bar.tsx:
///   weak   -> "Senha fraca"  / red-500     / 1/3 da largura
///   medium -> "Senha média"  / yellow-500  / 2/3
///   strong -> "Senha forte"  / emerald-500 / cheia
extension PasswordStrengthUi on PasswordStrength {
  String get label => switch (this) {
        PasswordStrength.weak => 'Senha fraca',
        PasswordStrength.medium => 'Senha média',
        PasswordStrength.strong => 'Senha forte',
      };

  double get fraction => switch (this) {
        PasswordStrength.weak => 1 / 3,
        PasswordStrength.medium => 2 / 3,
        PasswordStrength.strong => 1,
      };

  Color color(BuildContext context) => switch (this) {
        PasswordStrength.weak => AppColors.passwordWeak,
        PasswordStrength.medium => AppColors.warning,
        PasswordStrength.strong => context.success,
      };
}
