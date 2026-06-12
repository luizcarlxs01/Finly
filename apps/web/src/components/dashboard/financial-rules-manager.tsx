"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Play, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ApiFinancialRule } from "@/types/api-financial-rule";
import type { ApiRuleProcessingResult } from "@/types/api-rule-processing";
import type { UpsertApiFinancialRuleRequest } from "@/lib/api/financial-rules";
import { formatBusinessDateBr, formatDateTimeBr } from "@/utils/date-format";

type FinancialRulesManagerProps = {
  financialProfileId: string;
  isLoading?: boolean;
  isProcessing?: boolean;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  processErrorMessage?: string | null;
  processResult?: ApiRuleProcessingResult | null;
  rules: ApiFinancialRule[];
  onCreateRule: (input: UpsertApiFinancialRuleRequest) => Promise<void>;
  onDeleteRule: (id: string) => Promise<void>;
  onProcessRules: () => Promise<void>;
  onUpdateRule: (
    id: string,
    input: UpsertApiFinancialRuleRequest,
  ) => Promise<void>;
};

type FinancialRuleFormState = {
  amount: string;
  dayOfMonth: string;
  endDate: string;
  isActive: boolean;
  recurrenceMode: string;
  ruleType: string;
  startDate: string;
  title: string;
  totalMonths: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const fieldClassName =
  "w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

const defaultFormState: FinancialRuleFormState = {
  amount: "",
  dayOfMonth: "",
  endDate: "",
  isActive: true,
  recurrenceMode: "",
  ruleType: "Salary",
  startDate: "",
  title: "",
  totalMonths: "",
};

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ");
}

function getRuleTypeLabel(value: string) {
  const normalized = formatLabel(value).toLowerCase();

  if (normalized === "salary") {
    return "Salario";
  }

  if (normalized === "recurring income") {
    return "Receita recorrente";
  }

  if (normalized === "recurring expense") {
    return "Despesa recorrente";
  }

  if (normalized === "installment expense") {
    return "Despesa parcelada";
  }

  return formatLabel(value);
}

function getRecurrenceModeLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const normalized = formatLabel(value).toLowerCase();

  if (normalized === "indefinite") {
    return "Indefinida";
  }

  if (normalized === "until date") {
    return "Ate uma data";
  }

  if (normalized === "for months") {
    return "Por meses";
  }

  return formatLabel(value);
}

function buildFormState(rule: ApiFinancialRule): FinancialRuleFormState {
  return {
    amount: String(rule.amount),
    dayOfMonth: String(rule.dayOfMonth),
    endDate: rule.endDate ?? "",
    isActive: rule.isActive,
    recurrenceMode: rule.recurrenceMode ?? "",
    ruleType: rule.ruleType,
    startDate: rule.startDate,
    title: rule.title,
    totalMonths: rule.totalMonths === null ? "" : String(rule.totalMonths),
  };
}

function isRecurringRule(ruleType: string) {
  return ruleType !== "InstallmentExpense";
}

function normalizeFormState(
  financialProfileId: string,
  formState: FinancialRuleFormState,
): UpsertApiFinancialRuleRequest | null {
  const title = formState.title.trim();
  const amount = Number(formState.amount);
  const dayOfMonth = Number(formState.dayOfMonth);
  const totalMonths = formState.totalMonths ? Number(formState.totalMonths) : null;

  if (
    !title ||
    Number.isNaN(amount) ||
    amount <= 0 ||
    Number.isNaN(dayOfMonth) ||
    dayOfMonth < 1 ||
    dayOfMonth > 31 ||
    !formState.startDate
  ) {
    return null;
  }

  const isRecurring = isRecurringRule(formState.ruleType);
  const recurrenceMode = isRecurring ? formState.recurrenceMode || null : null;

  if (isRecurring && !recurrenceMode) {
    return null;
  }

  if (recurrenceMode === "UntilDate" && !formState.endDate) {
    return null;
  }

  if (
    (formState.ruleType === "InstallmentExpense" ||
      recurrenceMode === "ForMonths") &&
    (totalMonths === null || Number.isNaN(totalMonths) || totalMonths <= 0)
  ) {
    return null;
  }

  return {
    financialProfileId,
    title,
    amount,
    ruleType: formState.ruleType,
    recurrenceMode,
    dayOfMonth,
    startDate: formState.startDate,
    endDate: recurrenceMode === "UntilDate" ? formState.endDate : null,
    totalMonths:
      formState.ruleType === "InstallmentExpense" || recurrenceMode === "ForMonths"
        ? totalMonths
        : null,
    isActive: formState.isActive,
  };
}

function ProcessingResult({
  result,
}: {
  result: ApiRuleProcessingResult;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-border/60 bg-background/70 p-4">
        <p className="text-xs text-muted-foreground">Regras processadas</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {result.processedRuleCount}
        </p>
      </div>
      <div className="rounded-xl border border-border/60 bg-background/70 p-4">
        <p className="text-xs text-muted-foreground">Transacoes criadas</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {result.createdTransactionCount}
        </p>
      </div>
      <div className="rounded-xl border border-border/60 bg-background/70 p-4">
        <p className="text-xs text-muted-foreground">Transacoes ignoradas</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {result.skippedTransactionCount}
        </p>
      </div>
    </div>
  );
}

export function FinancialRulesManager({
  financialProfileId,
  isLoading = false,
  isProcessing = false,
  isSubmitting = false,
  errorMessage = null,
  processErrorMessage = null,
  processResult = null,
  rules,
  onCreateRule,
  onDeleteRule,
  onProcessRules,
  onUpdateRule,
}: FinancialRulesManagerProps) {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [formState, setFormState] = useState<FinancialRuleFormState>(defaultFormState);

  const editingRule = useMemo(
    () => rules.find((rule) => rule.id === editingRuleId) ?? null,
    [editingRuleId, rules],
  );
  const isRecurring = isRecurringRule(formState.ruleType);
  const shouldShowEndDate = isRecurring && formState.recurrenceMode === "UntilDate";
  const shouldShowTotalMonths =
    formState.ruleType === "InstallmentExpense" ||
    (isRecurring && formState.recurrenceMode === "ForMonths");

  useEffect(() => {
    if (!editingRule) {
      return;
    }

    setFormState(buildFormState(editingRule));
  }, [editingRule]);

  function resetForm() {
    setEditingRuleId(null);
    setFormState(defaultFormState);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const request = normalizeFormState(financialProfileId, formState);

    if (!request) {
      return;
    }

    try {
      if (editingRuleId) {
        await onUpdateRule(editingRuleId, request);
      } else {
        await onCreateRule(request);
      }

      resetForm();
    } catch {
      // A mensagem principal fica no card.
    }
  }

  async function handleDeleteRule(id: string) {
    try {
      await onDeleteRule(id);

      if (editingRuleId === id) {
        resetForm();
      }
    } catch {
      // A mensagem principal fica no card.
    }
  }

  async function handleProcessRules() {
    try {
      await onProcessRules();
    } catch {
      // A mensagem principal fica no card.
    }
  }

  return (
    <section className="space-y-6 rounded-[1.75rem] border border-border/60 bg-card/70 p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold tracking-tight text-foreground">
            Regras financeiras da conta
          </h3>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Crie, ajuste e processe regras automáticas sem sair da UI principal.
          </p>
        </div>

        <Button
          type="button"
          className="rounded-2xl"
          disabled={isProcessing || isLoading}
          onClick={() => void handleProcessRules()}
        >
          {isProcessing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}
          {isProcessing ? "Processando..." : "Processar regras agora"}
        </Button>
      </div>

      <div className="rounded-[1.25rem] border border-border/60 bg-background/55 px-4 py-3 text-sm text-muted-foreground">
        O processamento gera transacoes reais a partir das regras ativas. O saldo
        atual continua considerando apenas lancamentos com data ate hoje.
      </div>

      {processErrorMessage ? (
        <div className="rounded-[1.25rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {processErrorMessage}
        </div>
      ) : null}

      {processResult ? <ProcessingResult result={processResult} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,380px)_minmax(0,1fr)]">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-[1.5rem] border border-border/60 bg-background/60 p-4"
        >
          <div className="space-y-1">
            <h4 className="text-lg font-semibold text-foreground">
              {editingRuleId ? "Editar regra" : "Nova regra"}
            </h4>
            <p className="text-sm text-muted-foreground">
              Configure receitas, despesas recorrentes ou parcelamentos da conta.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="rule-title">
              Titulo
            </label>
            <input
              id="rule-title"
              value={formState.title}
              onChange={(event) =>
                setFormState((current) => ({ ...current, title: event.target.value }))
              }
              className={fieldClassName}
              placeholder="Ex.: Aluguel"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="rule-amount">
                Valor
              </label>
              <input
                id="rule-amount"
                type="number"
                step="0.01"
                value={formState.amount}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, amount: event.target.value }))
                }
                className={fieldClassName}
                placeholder="Ex.: 1200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="rule-type">
                Tipo
              </label>
              <select
                id="rule-type"
                value={formState.ruleType}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    recurrenceMode:
                      event.target.value === "InstallmentExpense"
                        ? ""
                        : current.recurrenceMode || "Indefinite",
                    ruleType: event.target.value,
                  }))
                }
                className={fieldClassName}
              >
                <option value="Salary">Salario</option>
                <option value="RecurringIncome">Receita recorrente</option>
                <option value="RecurringExpense">Despesa recorrente</option>
                <option value="InstallmentExpense">Despesa parcelada</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="rule-day">
                Dia do mes
              </label>
              <input
                id="rule-day"
                type="number"
                min={1}
                max={31}
                value={formState.dayOfMonth}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    dayOfMonth: event.target.value,
                  }))
                }
                className={fieldClassName}
                placeholder="Ex.: 5"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="rule-start">
                Data inicial
              </label>
              <input
                id="rule-start"
                type="date"
                value={formState.startDate}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    startDate: event.target.value,
                  }))
                }
                className={fieldClassName}
              />
            </div>
          </div>

          {isRecurring ? (
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-foreground"
                htmlFor="rule-recurrence-mode"
              >
                Recorrencia
              </label>
              <select
                id="rule-recurrence-mode"
                value={formState.recurrenceMode}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    recurrenceMode: event.target.value,
                  }))
                }
                className={fieldClassName}
              >
                <option value="Indefinite">Indefinida</option>
                <option value="UntilDate">Ate uma data</option>
                <option value="ForMonths">Por meses</option>
              </select>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {shouldShowEndDate ? (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="rule-end">
                  Data final
                </label>
                <input
                  id="rule-end"
                  type="date"
                  value={formState.endDate}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      endDate: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                />
              </div>
            ) : null}

            {shouldShowTotalMonths ? (
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="rule-total-months"
                >
                  {formState.ruleType === "InstallmentExpense"
                    ? "Parcelas"
                    : "Quantidade de meses"}
                </label>
                <input
                  id="rule-total-months"
                  type="number"
                  min={1}
                  value={formState.totalMonths}
                  onChange={(event) =>
                    setFormState((current) => ({
                      ...current,
                      totalMonths: event.target.value,
                    }))
                  }
                  className={fieldClassName}
                  placeholder="Ex.: 12"
                />
              </div>
            ) : null}
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 px-4 py-3 text-sm text-foreground">
            <input
              type="checkbox"
              checked={formState.isActive}
              onChange={(event) =>
                setFormState((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Regra ativa
          </label>

          {errorMessage ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              type="submit"
              className="rounded-2xl"
              disabled={isSubmitting}
            >
              {editingRuleId ? <Save className="size-4" /> : <Plus className="size-4" />}
              {isSubmitting
                ? "Salvando..."
                : editingRuleId
                  ? "Salvar alteracoes"
                  : "Criar regra"}
            </Button>

            {editingRuleId ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={resetForm}
              >
                Cancelar edicao
              </Button>
            ) : null}
          </div>
        </form>

        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/60 px-4 py-8 text-sm text-muted-foreground">
              Carregando regras financeiras...
            </div>
          ) : null}

          {!isLoading && rules.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-border/70 bg-background/60 px-4 py-8 text-sm text-muted-foreground">
              Nenhuma regra financeira criada nesta conta ainda.
            </div>
          ) : null}

          {!isLoading &&
            rules.map((rule) => (
              <article
                key={rule.id}
                className="rounded-[1.5rem] border border-border/60 bg-background/60 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-semibold text-foreground">
                        {rule.title}
                      </h4>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                        {getRuleTypeLabel(rule.ruleType)}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${
                          rule.isActive
                            ? "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {rule.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
                      <p>Valor: {currencyFormatter.format(rule.amount)}</p>
                      <p>Dia do mes: {rule.dayOfMonth}</p>
                      <p>
                        Inicio: {formatBusinessDateBr(rule.startDate) ?? rule.startDate}
                      </p>
                      {rule.endDate ? (
                        <p>Fim: {formatBusinessDateBr(rule.endDate) ?? rule.endDate}</p>
                      ) : null}
                      {rule.recurrenceMode ? (
                        <p>Recorrencia: {getRecurrenceModeLabel(rule.recurrenceMode)}</p>
                      ) : null}
                      {rule.totalMonths !== null ? (
                        <p>
                          {rule.ruleType === "InstallmentExpense"
                            ? "Parcelas"
                            : "Meses"}
                          : {rule.totalMonths}
                        </p>
                      ) : null}
                      {rule.lastProcessedDate ? (
                        <p>
                          Ultimo processamento:{" "}
                          {formatDateTimeBr(rule.lastProcessedDate) ??
                            rule.lastProcessedDate}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-2xl"
                      disabled={isSubmitting}
                      onClick={() => {
                        setEditingRuleId(rule.id);
                        setFormState(buildFormState(rule));
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="rounded-2xl"
                      disabled={isSubmitting}
                      onClick={() => void handleDeleteRule(rule.id)}
                    >
                      <Trash2 className="size-4" />
                      Remover
                    </Button>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </div>
    </section>
  );
}
