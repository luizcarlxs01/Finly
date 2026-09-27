"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  deriveCustomOkThreshold,
  resolveSpendingThresholds,
  SPENDING_PROFILE_DESCRIPTIONS,
  SPENDING_PROFILE_LABELS,
  validateCustomThresholds,
  type SpendingProfileId,
  type SpendingProfileSettings,
} from "@/utils/spending-profile";

type SpendingProfileCardProps = {
  settings: SpendingProfileSettings;
  isSubmitting?: boolean;
  onSave: (settings: SpendingProfileSettings) => Promise<void>;
};

const PROFILE_IDS: SpendingProfileId[] = ["economico", "padrao", "gastao", "personalizado"];

const fieldClassName =
  "w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/15";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function parseAmount(value: string): number | undefined {
  const normalized = value.replace(",", ".").trim();
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function ThresholdPreview({ ok, good }: { ok: number; good: number }) {
  return (
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-2 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-destructive">Ruim</p>
        <p className="mt-0.5 text-xs font-semibold text-destructive">{`< ${formatCurrency(ok)}`}</p>
      </div>
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Mais ou menos
        </p>
        <p className="mt-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
          {`${formatCurrency(ok)} – ${formatCurrency(good)}`}
        </p>
      </div>
      <div className="rounded-xl border border-primary/30 bg-primary/10 px-2 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-primary">Bom</p>
        <p className="mt-0.5 text-xs font-semibold text-primary">{`> ${formatCurrency(good)}`}</p>
      </div>
    </div>
  );
}

export function SpendingProfileCard({
  settings,
  isSubmitting = false,
  onSave,
}: SpendingProfileCardProps) {
  const [draftId, setDraftId] = useState<SpendingProfileId>(settings.id);
  const [personalizadoMode, setPersonalizadoMode] = useState<"auto" | "manual">("auto");
  const [goodInput, setGoodInput] = useState(
    settings.customGoodThreshold != null ? String(settings.customGoodThreshold) : "",
  );
  const [okInput, setOkInput] = useState(
    settings.customOkThreshold != null ? String(settings.customOkThreshold) : "",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setDraftId(settings.id);
    const good = settings.customGoodThreshold ?? null;
    const ok = settings.customOkThreshold ?? null;
    setGoodInput(good != null ? String(good) : "");
    setOkInput(ok != null ? String(ok) : "");

    // Não persistimos qual modo a pessoa usou da última vez — inferimos pelo
    // valor: se "Mais ou menos" bate com o cálculo proporcional do "Bom"
    // salvo, mostramos como "auto"; senão, é porque ela personalizou os dois
    // valores, então mostramos "manual" com o valor real (nunca o recalculado).
    if (good != null && ok != null) {
      const autoOk = deriveCustomOkThreshold(good);
      setPersonalizadoMode(Math.abs(autoOk - ok) < 0.01 ? "auto" : "manual");
    } else {
      setPersonalizadoMode("auto");
    }
  }, [settings.id, settings.customGoodThreshold, settings.customOkThreshold]);

  const goodValue = parseAmount(goodInput);
  const okValue = personalizadoMode === "manual" ? parseAmount(okInput) : undefined;

  const previewThresholds =
    draftId === "personalizado"
      ? resolveSpendingThresholds({
          id: "personalizado",
          customGoodThreshold: goodValue ?? null,
          customOkThreshold: okValue ?? null,
        })
      : resolveSpendingThresholds({ id: draftId });

  async function handleSave() {
    setErrorMessage(null);
    setSuccessMessage(null);

    const nextSettings: SpendingProfileSettings =
      draftId === "personalizado"
        ? {
            id: "personalizado",
            customGoodThreshold: goodValue ?? null,
            customOkThreshold: personalizadoMode === "manual" ? okValue ?? null : null,
          }
        : { id: draftId };

    if (draftId === "personalizado") {
      const validationError = validateCustomThresholds(
        goodValue,
        personalizadoMode === "manual" ? okValue : undefined,
      );

      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
    }

    try {
      await onSave(nextSettings);
      setSuccessMessage("Perfil de gastos atualizado.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Não foi possível salvar o perfil de gastos agora.",
      );
    }
  }

  return (
    <Card className="rounded-[1.5rem] border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="space-y-1 pb-3">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Seu perfil de gastos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Calibra o que consideramos uma boa sobra no saldo de acordo com a sua realidade
          financeira.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {PROFILE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setDraftId(id);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                draftId === id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border/70 bg-background text-foreground hover:border-primary/50"
              }`}
            >
              {SPENDING_PROFILE_LABELS[id]}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">
          {SPENDING_PROFILE_DESCRIPTIONS[draftId]}
        </p>

        {draftId === "personalizado" ? (
          <div className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPersonalizadoMode("auto")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  personalizadoMode === "auto"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:border-primary/40"
                }`}
              >
                Só o valor de Bom
              </button>
              <button
                type="button"
                onClick={() => setPersonalizadoMode("manual")}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  personalizadoMode === "manual"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:border-primary/40"
                }`}
              >
                Personalizar tudo
              </button>
            </div>

            {personalizadoMode === "auto" ? (
              <div className="space-y-1.5">
                <label htmlFor="spending-good" className="text-xs font-medium text-foreground">
                  A partir de quanto você considera uma boa sobra?
                </label>
                <input
                  id="spending-good"
                  type="text"
                  inputMode="decimal"
                  value={goodInput}
                  onChange={(event) => setGoodInput(event.target.value)}
                  placeholder="Ex.: 5000"
                  className={fieldClassName}
                />
                {goodValue && goodValue > 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Calculamos "Mais ou menos" a partir de{" "}
                    {formatCurrency(deriveCustomOkThreshold(goodValue))} automaticamente.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="spending-ok" className="text-xs font-medium text-foreground">
                    "Mais ou menos" a partir de
                  </label>
                  <input
                    id="spending-ok"
                    type="text"
                    inputMode="decimal"
                    value={okInput}
                    onChange={(event) => setOkInput(event.target.value)}
                    placeholder="Ex.: 1000"
                    className={fieldClassName}
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="spending-good-manual" className="text-xs font-medium text-foreground">
                    "Bom" a partir de
                  </label>
                  <input
                    id="spending-good-manual"
                    type="text"
                    inputMode="decimal"
                    value={goodInput}
                    onChange={(event) => setGoodInput(event.target.value)}
                    placeholder="Ex.: 5000"
                    className={fieldClassName}
                  />
                </div>
              </div>
            )}
          </div>
        ) : null}

        <ThresholdPreview ok={previewThresholds.ok} good={previewThresholds.good} />

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-xs text-primary">
            {successMessage}
          </div>
        ) : null}

        <Button
          type="button"
          className="h-10 w-full rounded-xl"
          disabled={isSubmitting}
          onClick={handleSave}
        >
          {isSubmitting ? "Salvando..." : "Salvar perfil de gastos"}
        </Button>
      </CardContent>
    </Card>
  );
}
