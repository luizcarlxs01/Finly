/**
 * Perfil de gastos — calibra os avisos de saldo em Insights (dashboard-insights.ts)
 * de acordo com o porte financeiro da pessoa, em vez de um único corte fixo pra
 * todo mundo. Réplica futura em apps/mobile deve espelhar exatamente este arquivo,
 * igual occurrence-generation.ts espelha o backend (seção 21 do CLAUDE.md).
 */

export type SpendingProfileId = "economico" | "padrao" | "gastao" | "personalizado";

export type SpendingThresholds = {
  ok: number;
  good: number;
};

export type SpendingProfileSettings = {
  id: SpendingProfileId;
  customOkThreshold?: number | null;
  customGoodThreshold?: number | null;
};

export const SPENDING_PROFILE_PRESETS: Record<
  Exclude<SpendingProfileId, "personalizado">,
  SpendingThresholds
> = {
  economico: { ok: 200, good: 800 },
  padrao: { ok: 500, good: 2000 },
  gastao: { ok: 2000, good: 8000 },
};

export const SPENDING_PROFILE_LABELS: Record<SpendingProfileId, string> = {
  economico: "Econômico",
  padrao: "Padrão",
  gastao: "Gastão",
  personalizado: "Personalizado",
};

export const SPENDING_PROFILE_DESCRIPTIONS: Record<SpendingProfileId, string> = {
  economico: "Sobra menor já conta como uma boa notícia.",
  gastao: "Precisa de uma folga maior pra ser considerada boa.",
  padrao: "Faixas de referência para o padrão médio.",
  personalizado: "Você define os valores que fazem sentido pra você.",
};

/**
 * Sem "Mais ou menos" explícito no Personalizado, deriva proporcionalmente do
 * valor de "Bom" informado — mesma razão do perfil Padrão (500/2000 = 25%).
 * Mantido em sincronia com PersonalizadoOkRatio em ProfileService.cs (backend).
 */
export const PERSONALIZADO_OK_RATIO = 0.25;

export function deriveCustomOkThreshold(goodThreshold: number): number {
  return Math.round(goodThreshold * PERSONALIZADO_OK_RATIO * 100) / 100;
}

export const DEFAULT_SPENDING_PROFILE_SETTINGS: SpendingProfileSettings = {
  id: "padrao",
};

export function resolveSpendingThresholds(
  settings: SpendingProfileSettings,
): SpendingThresholds {
  if (settings.id !== "personalizado") {
    return SPENDING_PROFILE_PRESETS[settings.id];
  }

  const good =
    settings.customGoodThreshold && settings.customGoodThreshold > 0
      ? settings.customGoodThreshold
      : SPENDING_PROFILE_PRESETS.padrao.good;

  const ok =
    settings.customOkThreshold != null
      ? settings.customOkThreshold
      : deriveCustomOkThreshold(good);

  return { ok, good };
}

/**
 * Valida os limiares do Personalizado — mesma regra em local e API (backend
 * replica em ProfileService.NormalizeThresholds). "Bom" é obrigatório sempre
 * que o perfil é Personalizado; "Mais ou menos" é opcional (é derivado se
 * ausente), mas quando informado precisa ser >=0 e menor que "Bom".
 */
export function validateCustomThresholds(
  goodThreshold: number | undefined,
  okThreshold: number | undefined,
): string | null {
  if (goodThreshold === undefined || Number.isNaN(goodThreshold) || goodThreshold <= 0) {
    return 'Informe o valor de "Bom" para o perfil personalizado.';
  }

  if (okThreshold !== undefined && !Number.isNaN(okThreshold)) {
    if (okThreshold < 0) {
      return 'O valor de "Mais ou menos" não pode ser negativo.';
    }

    if (okThreshold >= goodThreshold) {
      return 'O valor de "Mais ou menos" deve ser menor que o valor de "Bom".';
    }
  }

  return null;
}

// Normalização de vocabulário — mesma ideia de normalizeTransactionType em
// transaction-normalization.ts: a API devolve o enum em PascalCase ("Padrao"),
// o front usa lowercase internamente.
export function spendingProfileFromApi(value: string | null | undefined): SpendingProfileId {
  switch ((value ?? "").toLowerCase()) {
    case "economico":
      return "economico";
    case "gastao":
      return "gastao";
    case "personalizado":
      return "personalizado";
    default:
      return "padrao";
  }
}

export function getBackendSpendingProfile(id: SpendingProfileId): string {
  switch (id) {
    case "economico":
      return "Economico";
    case "gastao":
      return "Gastao";
    case "personalizado":
      return "Personalizado";
    default:
      return "Padrao";
  }
}
