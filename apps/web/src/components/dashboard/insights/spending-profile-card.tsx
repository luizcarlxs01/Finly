"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TruncatedValue } from "@/components/ui/truncated-value";
import {
  deriveCustomOkThreshold,
  resolveSpendingThresholds,
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

export type SpendingProfileLayoutTransition = {
  begin: (update: () => void) => void;
  finish: () => void;
};

export const SpendingProfileLayoutContext = createContext<SpendingProfileLayoutTransition>({
  begin: (update) => update(),
  finish: () => {},
});

const fieldClassName =
  "w-full rounded-lg border border-border/50 bg-background/60 px-3 py-2.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/15";

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
    <div
      data-threshold-preview
      className="grid grid-cols-3 divide-x divide-border/60 overflow-hidden rounded-xl border border-border/50 bg-background/45 text-center shadow-sm backdrop-blur-sm"
    >
      <div className="min-w-0 px-2 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Ruim
        </p>
        <TruncatedValue className="mt-0.5 text-xs font-semibold text-foreground" value={`< ${formatCurrency(ok)}`} />
      </div>
      <div className="min-w-0 px-2 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Mediano
        </p>
        <TruncatedValue className="mt-0.5 text-xs font-semibold text-foreground" value={`${formatCurrency(ok)} – ${formatCurrency(good)}`} />
      </div>
      <div className="min-w-0 px-2 py-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-primary">
          Bom
        </p>
        <TruncatedValue className="mt-0.5 text-xs font-semibold text-primary" value={`> ${formatCurrency(good)}`} />
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
  const [customPanelOpen, setCustomPanelOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const animateLayout = useContext(SpendingProfileLayoutContext);
  const layoutTransitionPendingRef = useRef(false);
  const profileSelectorRef = useRef<HTMLDivElement>(null);
  const collapsedButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useLayoutEffect(() => {
    if (!layoutTransitionPendingRef.current) return;
    layoutTransitionPendingRef.current = false;
    animateLayout.finish();
    if (isCollapsed) collapsedButtonRef.current?.focus({ preventScroll: true });
  }, [animateLayout, isCollapsed]);

  const settingsKey = JSON.stringify([settings.id, settings.customGoodThreshold, settings.customOkThreshold]);
  const [previousSettingsKey, setPreviousSettingsKey] = useState(settingsKey);
  if (previousSettingsKey !== settingsKey) {
    setPreviousSettingsKey(settingsKey);
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
  }

  useEffect(() => {
    if (!customPanelOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (!profileSelectorRef.current?.contains(event.target as Node)) {
        setCustomPanelOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCustomPanelOpen(false);
        document.getElementById("spending-profile-personalizado")?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [customPanelOpen]);

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
      layoutTransitionPendingRef.current = true;
      animateLayout.begin(() => {
        setSuccessMessage("Perfil de gastos atualizado.");
        setCustomPanelOpen(false);
        setIsCollapsed(true);
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message.trim()
          ? error.message
          : "Não foi possível salvar o perfil de gastos agora.",
      );
    }
  }

  if (isCollapsed) {
    return (
      <Card
        data-profile-collapsed="true"
        className="rounded-2xl border-border/50 bg-card/55 shadow-sm backdrop-blur-xl"
      >
        <button
          ref={collapsedButtonRef}
          type="button"
          aria-label={`Expandir perfil de gastos. Perfil selecionado: ${SPENDING_PROFILE_LABELS[draftId]}`}
          aria-expanded={false}
          onClick={() => {
            layoutTransitionPendingRef.current = true;
            animateLayout.begin(() => setIsCollapsed(false));
          }}
          className="flex min-h-16 w-full items-center justify-between gap-3 px-5 py-2 text-left focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-3px]"
        >
          <span className="min-w-0">
            <span className="block text-base font-semibold tracking-tight text-foreground">
              Seu perfil de gastos
            </span>
            <span className="mt-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="truncate">{SPENDING_PROFILE_LABELS[draftId]}</span>
              <span role="status" className="inline-flex shrink-0 items-center gap-1 text-xs text-primary">
                {successMessage ? <><Check className="size-3.5" aria-hidden="true" /><span aria-label={successMessage}>Salvo</span></> : null}
              </span>
            </span>
          </span>
          <ChevronRight className="size-5 shrink-0 text-slate-950 dark:text-slate-100" aria-hidden="true" />
        </button>
      </Card>
    );
  }

  return (
    <Card
      data-profile-collapsed="false"
      className={`relative ${customPanelOpen ? "z-30" : ""} overflow-visible rounded-2xl border-border/50 bg-card/55 shadow-sm backdrop-blur-xl`}
    >
      <button
        type="button"
        data-profile-collapse
        aria-label="Recolher perfil de gastos"
        aria-expanded={true}
        aria-controls="spending-profile-details"
        onClick={() => {
          layoutTransitionPendingRef.current = true;
          animateLayout.begin(() => {
            setCustomPanelOpen(false);
            setIsCollapsed(true);
          });
        }}
        className="absolute right-2 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center text-slate-950 transition-opacity hover:opacity-65 focus-visible:outline-2 focus-visible:outline-primary dark:text-slate-100"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <CardHeader className="space-y-1 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">
          Seu perfil de gastos
        </CardTitle>
        <div
          ref={profileSelectorRef}
          data-profile-selector
          className="relative z-20 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 sm:grid-cols-4"
        >
          {PROFILE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setDraftId(id);
                setCustomPanelOpen(id === "personalizado");
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              id={id === "personalizado" ? "spending-profile-personalizado" : undefined}
              aria-expanded={id === "personalizado" ? customPanelOpen : undefined}
              aria-controls={id === "personalizado" ? "spending-custom-settings" : undefined}
              aria-pressed={draftId === id}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-primary ${
                draftId === id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {SPENDING_PROFILE_LABELS[id]}
            </button>
          ))}

          {customPanelOpen && draftId === "personalizado" ? (
            <div
              id="spending-custom-settings"
              role="region"
              aria-label="Configurações do perfil personalizado"
              className="absolute left-1/2 top-[calc(100%+10px)] z-50 w-[min(620px,calc(100vw-40px))] -translate-x-1/2 space-y-3 rounded-xl border border-border/60 bg-card/95 p-4 shadow-xl backdrop-blur-xl sm:p-5"
            >
              <button
                type="button"
                aria-label="Fechar configurações personalizadas"
                onClick={() => setCustomPanelOpen(false)}
                className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
              <div className="grid grid-cols-2 gap-2 pr-8">
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
                    <p className="text-[11px] text-muted-foreground" title={`Calculamos "Mediano" a partir de ${formatCurrency(deriveCustomOkThreshold(goodValue))} automaticamente.`}>
                      Calculamos &quot;Mediano&quot; a partir de{" "}
                      {formatCurrency(deriveCustomOkThreshold(goodValue))} automaticamente.
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="spending-ok" className="text-xs font-medium text-foreground">
                      &quot;Mediano&quot; a partir de
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
                      &quot;Bom&quot; a partir de
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
        </div>
        <Button
          type="button"
          className="h-10 rounded-lg px-5"
          disabled={isSubmitting}
          onClick={handleSave}
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
      </CardHeader>

      <CardContent id="spending-profile-details" className="space-y-3.5">
        <ThresholdPreview ok={previewThresholds.ok} good={previewThresholds.good} />

        {errorMessage ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {errorMessage}
          </div>
        ) : null}

      </CardContent>
    </Card>
  );
}
