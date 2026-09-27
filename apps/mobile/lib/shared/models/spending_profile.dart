/// Perfil de gastos — espelha apps/web/src/utils/spending-profile.ts. Calibra
/// os avisos de saldo em Insights de acordo com o porte financeiro da pessoa.
/// Réplica exata é obrigatória: qualquer mudança de faixa ou de razão precisa
/// ser feita nos dois lados (seção 29 do CLAUDE.md).
enum SpendingProfileId {
  economico,
  padrao,
  gastao,
  personalizado;

  String get apiValue => switch (this) {
        SpendingProfileId.economico => 'Economico',
        SpendingProfileId.gastao => 'Gastao',
        SpendingProfileId.personalizado => 'Personalizado',
        SpendingProfileId.padrao => 'Padrao',
      };

  String get label => switch (this) {
        SpendingProfileId.economico => 'Econômico',
        SpendingProfileId.padrao => 'Padrão',
        SpendingProfileId.gastao => 'Gastão',
        SpendingProfileId.personalizado => 'Personalizado',
      };

  String get description => switch (this) {
        SpendingProfileId.economico => 'Sobra menor já conta como uma boa notícia.',
        SpendingProfileId.gastao => 'Precisa de uma folga maior pra ser considerada boa.',
        SpendingProfileId.padrao => 'Faixas de referência para o padrão médio.',
        SpendingProfileId.personalizado =>
          'Você define os valores que fazem sentido pra você.',
      };

  /// Vocabulário cru vindo da API (PascalCase) — mesma normalização de
  /// TransactionType.fromApi.
  static SpendingProfileId fromApi(String? value) {
    switch ((value ?? '').trim().toLowerCase()) {
      case 'economico':
        return SpendingProfileId.economico;
      case 'gastao':
        return SpendingProfileId.gastao;
      case 'personalizado':
        return SpendingProfileId.personalizado;
      default:
        return SpendingProfileId.padrao;
    }
  }

  /// Vocabulário salvo no modo local (`.name`, já lowercase) — nunca depende
  /// de índice de enum, senão reordenar o enum corromperia dados salvos.
  static SpendingProfileId fromLocalName(String? value) {
    return SpendingProfileId.values.firstWhere(
      (e) => e.name == value,
      orElse: () => SpendingProfileId.padrao,
    );
  }
}

const Map<SpendingProfileId, ({double ok, double good})> spendingProfilePresets = {
  SpendingProfileId.economico: (ok: 200, good: 800),
  SpendingProfileId.padrao: (ok: 500, good: 2000),
  SpendingProfileId.gastao: (ok: 2000, good: 8000),
};

/// Sem "Mais ou menos" explícito no Personalizado, deriva proporcionalmente do
/// valor de "Bom" — mesma razão do perfil Padrão (500/2000 = 25%). Mantido em
/// sincronia com PersonalizadoOkRatio (backend) e PERSONALIZADO_OK_RATIO (web).
const double personalizadoOkRatio = 0.25;

double deriveCustomOkThreshold(double goodThreshold) =>
    (goodThreshold * personalizadoOkRatio * 100).round() / 100;

class SpendingProfileSettings {
  const SpendingProfileSettings({
    required this.id,
    this.customOkThreshold,
    this.customGoodThreshold,
  });

  final SpendingProfileId id;
  final double? customOkThreshold;
  final double? customGoodThreshold;

  static const defaults = SpendingProfileSettings(id: SpendingProfileId.padrao);
}

({double ok, double good}) resolveSpendingThresholds(SpendingProfileSettings settings) {
  if (settings.id != SpendingProfileId.personalizado) {
    return spendingProfilePresets[settings.id]!;
  }

  final good = (settings.customGoodThreshold != null && settings.customGoodThreshold! > 0)
      ? settings.customGoodThreshold!
      : spendingProfilePresets[SpendingProfileId.padrao]!.good;
  final ok = settings.customOkThreshold ?? deriveCustomOkThreshold(good);

  return (ok: ok, good: good);
}

/// Valida os limiares do Personalizado — mesma regra em local e API (backend
/// replica em ProfileService.NormalizeThresholds, web em validateCustomThresholds).
String? validateCustomThresholds({double? goodThreshold, double? okThreshold}) {
  if (goodThreshold == null || goodThreshold <= 0) {
    return 'Informe o valor de "Bom" para o perfil personalizado.';
  }

  if (okThreshold != null) {
    if (okThreshold < 0) {
      return 'O valor de "Mais ou menos" não pode ser negativo.';
    }
    if (okThreshold >= goodThreshold) {
      return 'O valor de "Mais ou menos" deve ser menor que o valor de "Bom".';
    }
  }

  return null;
}
