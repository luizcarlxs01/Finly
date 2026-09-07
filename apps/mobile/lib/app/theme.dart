import 'package:flutter/material.dart';

/// Paleta extraída **verbatim** de apps/web/src/app/globals.css (tokens shadcn,
/// blocos `:root` e `.dark`). Nada aproximado — os hex abaixo são os mesmos do
/// web. Cores auxiliares (sucesso / aviso / erro-de-senha) vêm das classes
/// Tailwind usadas nos componentes do web:
///   - verde "Pago" ........ emerald-500 / emerald-400  (financial-calendar-grid)
///   - amarelo "Senha média" yellow-500                 (password-strength-bar)
///   - vermelho "Senha fraca" red-500                   (password-strength-bar)
class AppColors {
  AppColors._();

  // ---- Light (globals.css :root) ----------------------------------------
  static const backgroundLight = Color(0xFFF4F7FB); // --background
  static const foregroundLight = Color(0xFF031533); // --foreground
  static const surfaceLight = Color(0xFFFFFFFF); // --card / --popover
  static const surfaceForegroundLight = Color(0xFF031533); // --card-foreground
  static const primaryLight = Color(0xFF1A75FF); // --primary
  static const primaryForegroundLight = Color(0xFFFFFFFF); // --primary-foreground
  static const secondaryLight = Color(0xFF7EB0F2); // --secondary
  static const secondaryForegroundLight = Color(0xFF031533);
  static const mutedLight = Color(0xFFD0DFF2); // --muted
  static const mutedForegroundLight = Color(0xFF4F698D); // --muted-foreground
  static const accentLight = Color(0xFF7EB0F2); // --accent
  static const accentForegroundLight = Color(0xFF031533);
  static const destructiveLight = Color(0xFFB91C1C); // --destructive
  static const borderLight = Color(0xFFD0DFF2); // --border / --input
  static const ringLight = Color(0xFF1A75FF); // --ring

  // ---- Dark (globals.css .dark) ----------------------------------------
  static const backgroundDark = Color(0xFF031533); // --background
  static const foregroundDark = Color(0xFFF4F7FB); // --foreground
  static const surfaceDark = Color(0xFF0B275E); // --card / --popover
  static const surfaceForegroundDark = Color(0xFFF4F7FB);
  static const primaryDark = Color(0xFF7EB0F2); // --primary
  static const primaryForegroundDark = Color(0xFF031533);
  static const secondaryDark = Color(0xFF1A75FF); // --secondary
  static const secondaryForegroundDark = Color(0xFFF4F7FB);
  static const mutedDark = Color(0xFF304D80); // --muted
  static const mutedForegroundDark = Color(0xFFD0DFF2); // --muted-foreground
  static const accentDark = Color(0xFF1A75FF); // --accent
  static const accentForegroundDark = Color(0xFFF4F7FB);
  static const destructiveDark = Color(0xFFDC2626); // --destructive
  static const borderDark = Color(0xFF304D80); // --border / --input
  static const ringDark = Color(0xFF7EB0F2); // --ring

  // ---- Auxiliares (classes Tailwind do web) ---------------------------
  static const successLight = Color(0xFF10B981); // emerald-500 — "Pago"
  static const successDark = Color(0xFF34D399); // emerald-400 — "Pago" (dark)
  static const warning = Color(0xFFEAB308); // yellow-500 — "Senha média" / pendente
  static const passwordWeak = Color(0xFFEF4444); // red-500 — "Senha fraca"

  // O raio base do web (--radius: 0.625rem = 10px). Cartões usam multiplicadores
  // maiores (1.25rem–2rem); aqui aproximamos com 20 para os cartões e 12 para os
  // campos, replicando a sensação arredondada da UI.
  static const double radius = 10;
  static const double cardRadius = 20;
  static const double fieldRadius = 14;
}

class AppTheme {
  AppTheme._();

  static ThemeData light() => _build(Brightness.light);
  static ThemeData dark() => _build(Brightness.dark);

  static ThemeData _build(Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    final background =
        isDark ? AppColors.backgroundDark : AppColors.backgroundLight;
    final foreground =
        isDark ? AppColors.foregroundDark : AppColors.foregroundLight;
    final surface = isDark ? AppColors.surfaceDark : AppColors.surfaceLight;
    final primary = isDark ? AppColors.primaryDark : AppColors.primaryLight;
    final primaryFg = isDark
        ? AppColors.primaryForegroundDark
        : AppColors.primaryForegroundLight;
    final border = isDark ? AppColors.borderDark : AppColors.borderLight;
    final mutedFg =
        isDark ? AppColors.mutedForegroundDark : AppColors.mutedForegroundLight;
    final destructive =
        isDark ? AppColors.destructiveDark : AppColors.destructiveLight;

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary: primary,
      onPrimary: primaryFg,
      secondary: isDark ? AppColors.secondaryDark : AppColors.secondaryLight,
      onSecondary: isDark
          ? AppColors.secondaryForegroundDark
          : AppColors.secondaryForegroundLight,
      tertiary: isDark ? AppColors.accentDark : AppColors.accentLight,
      onTertiary: isDark
          ? AppColors.accentForegroundDark
          : AppColors.accentForegroundLight,
      error: destructive,
      onError: Colors.white,
      surface: surface,
      onSurface: isDark
          ? AppColors.surfaceForegroundDark
          : AppColors.surfaceForegroundLight,
      surfaceContainerHighest: isDark ? AppColors.mutedDark : AppColors.mutedLight,
      onSurfaceVariant: mutedFg,
      outline: border,
      outlineVariant: border,
    );

    final baseText = (isDark ? Typography.whiteMountainView : Typography.blackMountainView)
        .apply(fontFamily: 'Roboto', bodyColor: foreground, displayColor: foreground);

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: background,
      colorScheme: colorScheme,
      textTheme: baseText,
      fontFamily: 'Roboto',
      appBarTheme: AppBarTheme(
        backgroundColor: background,
        foregroundColor: foreground,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppColors.cardRadius),
          side: BorderSide(color: border),
        ),
      ),
      dividerTheme: DividerThemeData(color: border, thickness: 1, space: 1),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: primaryFg,
          disabledBackgroundColor: primary.withValues(alpha: 0.5),
          disabledForegroundColor: primaryFg.withValues(alpha: 0.8),
          minimumSize: const Size.fromHeight(48),
          elevation: 0,
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppColors.fieldRadius),
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: foreground,
          minimumSize: const Size.fromHeight(48),
          side: BorderSide(color: border),
          textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppColors.fieldRadius),
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: primary),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: isDark
            ? AppColors.surfaceDark
            : AppColors.backgroundLight,
        hintStyle: TextStyle(color: mutedFg),
        labelStyle: TextStyle(color: mutedFg),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppColors.fieldRadius),
          borderSide: BorderSide(color: border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppColors.fieldRadius),
          borderSide: BorderSide(color: border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppColors.fieldRadius),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppColors.fieldRadius),
          borderSide: BorderSide(color: destructive),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: surface,
        indicatorColor: primary.withValues(alpha: 0.14),
        elevation: 0,
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: states.contains(WidgetState.selected) ? primary : mutedFg,
          ),
        ),
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            color: states.contains(WidgetState.selected) ? primary : mutedFg,
          ),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: isDark ? AppColors.surfaceDark : AppColors.foregroundLight,
        contentTextStyle: TextStyle(
          color: isDark ? AppColors.foregroundDark : Colors.white,
        ),
      ),
    );
  }
}

/// Tokens semânticos dependentes de brilho, resolvidos a partir do contexto —
/// espelham as combinações Tailwind que o web faz inline (ex.: entrada =
/// text-primary, saída = text-foreground, "Pago" = emerald).
extension AppColorsX on BuildContext {
  ColorScheme get scheme => Theme.of(this).colorScheme;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;

  Color get mutedForeground =>
      isDark ? AppColors.mutedForegroundDark : AppColors.mutedForegroundLight;
  Color get success => isDark ? AppColors.successDark : AppColors.successLight;
  Color get warning => AppColors.warning;

  /// Cor de um valor monetário conforme a natureza (mesma regra do web:
  /// entrada usa a primária, saída usa o foreground neutro).
  Color amountColor(bool isIncome) =>
      isIncome ? scheme.primary : scheme.onSurface;
}
