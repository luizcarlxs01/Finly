import 'package:flutter/material.dart';

/// Paleta extraída do mockup "Finly Mobile v2" — deve ficar em paridade
/// visual com apps/web (globals.css / tokens shadcn).
class AppColors {
  AppColors._();

  // Primária (violeta)
  static const primary = Color(0xFF7F3DFF);
  static const primaryDark = Color(0xFF5B23D6);
  static const primarySoft = Color(0xFFEEE5FF);
  static const primarySofter = Color(0xFFF0EEF8);

  // Sucesso (verde)
  static const success = Color(0xFF22A06B);
  static const successDark = Color(0xFF12613D);
  static const successSoft = Color(0xFFE2F4EC);
  static const successText = Color(0xFF1A7A50);

  // Erro / destrutivo (vermelho)
  static const danger = Color(0xFFFD5468);
  static const dangerText = Color(0xFFC8354A);
  static const dangerSoft = Color(0xFFFFE6E9);

  // Aviso (laranja/amarelo)
  static const warning = Color(0xFFF5A623);
  static const warningText = Color(0xFFC77A0F);
  static const warningSoft = Color(0xFFFDF0D9);

  // Neutros
  static const ink = Color(0xFF1A1523);
  static const inkSoft = Color(0xFF635E73);
  static const muted = Color(0xFF8B869A);
  static const mutedLight = Color(0xFFB5AFC6);
  static const border = Color(0xFFEAE7F2);
  static const borderLight = Color(0xFFDFDBEA);
  static const surface = Color(0xFFFFFFFF);
  static const background = Color(0xFFF4F3F9);
  static const backgroundAlt = Color(0xFFEDEBF3);
  static const backgroundSubtle = Color(0xFFFBFAFE);

  // Categorias (mapeamento fixo — replica apps/web utils/categories)
  static const catSalario = Color(0xFF22A06B);
  static const catCompras = Color(0xFF7F3DFF);
  static const catAlimentacao = Color(0xFFF5A623);
  static const catTransporte = Color(0xFF2F80ED);
  static const catMoradia = Color(0xFFEB5757);
  static const catContas = Color(0xFFF2994A);
  static const catSaude = Color(0xFFEB5757);
  static const catLazer = Color(0xFF9B51E0);
  static const catEducacao = Color(0xFF2D9CDB);
  static const catInvestimentos = Color(0xFF219653);
  static const catGeral = Color(0xFF8B869A);
}
