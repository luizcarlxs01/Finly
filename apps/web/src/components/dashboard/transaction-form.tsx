"use client";

import { useState } from "react";
import { CalendarDays, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LocalFinanceTransactionInput } from "@/hooks/use-local-finance";
import type {
  TransactionRecurrenceMode,
  TransactionType,
} from "@/types/transaction";
import {
  DEFAULT_TRANSACTION_CATEGORY,
  getTransactionCategoryLabel,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";
import {
  getTodayDateValue,
  getTodayRecurrenceDay,
} from "@/utils/recurring-transactions";

type TransactionEditorKind =
  | "single"
  | "installment-template"
  | "recurring-template";

type TransactionFormProps = {
  onAddTransaction: (
    input: LocalFinanceTransactionInput,
  ) => Promise<void> | void;
  onPreviewTransaction: (input: LocalFinanceTransactionInput) => void;
  onClearPreview: () => void;
  isPreviewActive: boolean;
  showPreviewNotice?: boolean;
  isSubmitting?: boolean;
};

const inputClassName =
  "w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/15";

export function TransactionForm({
  onAddTransaction,
  onPreviewTransaction,
  onClearPreview,
  isPreviewActive,
  showPreviewNotice = true,
  isSubmitting = false,
}: TransactionFormProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState(DEFAULT_TRANSACTION_CATEGORY);
  const [transactionKind, setTransactionKind] =
    useState<TransactionEditorKind>("single");
  const [transactionDate, setTransactionDate] = useState(getTodayDateValue());
  const [installmentCount, setInstallmentCount] = useState("2");
  const [installmentStartDate, setInstallmentStartDate] =
    useState(getTodayDateValue());
  const [recurrenceDay, setRecurrenceDay] = useState(getTodayRecurrenceDay());
  const [recurrenceStartDate, setRecurrenceStartDate] =
    useState(getTodayDateValue());
  const [recurrenceMode, setRecurrenceMode] =
    useState<TransactionRecurrenceMode>("indefinite");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(getTodayDateValue());
  const [recurrenceMonths, setRecurrenceMonths] = useState("3");

  function resetTransactionForm() {
    setTitle("");
    setAmount("");
    setType("expense");
    setCategory(DEFAULT_TRANSACTION_CATEGORY);
    setTransactionKind("single");
    setTransactionDate(getTodayDateValue());
    setInstallmentCount("2");
    setInstallmentStartDate(getTodayDateValue());
    setRecurrenceDay(getTodayRecurrenceDay());
    setRecurrenceStartDate(getTodayDateValue());
    setRecurrenceMode("indefinite");
    setRecurrenceEndDate(getTodayDateValue());
    setRecurrenceMonths("3");
  }

  function buildTransactionInput() {
    const parsedAmount = Number(amount);
    const normalizedTitle = title.trim();
    const normalizedCategory = category.trim();

    if (
      !normalizedTitle ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0 ||
      !normalizedCategory
    ) {
      return null;
    }

    if (transactionKind === "single") {
      const normalizedTransactionDate = transactionDate.trim();

      if (!normalizedTransactionDate) {
        return null;
      }

      return {
        title: normalizedTitle,
        amount: parsedAmount,
        type,
        category: normalizedCategory,
        transactionKind: "single",
        transactionDate: normalizedTransactionDate,
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      } satisfies LocalFinanceTransactionInput;
    }

    if (transactionKind === "installment-template") {
      const parsedInstallmentCount = Number(installmentCount);
      const normalizedInstallmentStartDate = installmentStartDate.trim();

      if (
        Number.isNaN(parsedInstallmentCount) ||
        parsedInstallmentCount < 2 ||
        !normalizedInstallmentStartDate
      ) {
        return null;
      }

      return {
        title: normalizedTitle,
        amount: parsedAmount,
        type,
        category: normalizedCategory,
        transactionKind: "installment-template",
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
        installmentCount: parsedInstallmentCount,
        installmentStartDate: normalizedInstallmentStartDate,
      } satisfies LocalFinanceTransactionInput;
    }

    const parsedRecurrenceDay = Number(recurrenceDay);
    const parsedRecurrenceMonths = Number(recurrenceMonths);
    const normalizedRecurrenceStartDate = recurrenceStartDate.trim();
    const normalizedRecurrenceEndDate = recurrenceEndDate.trim();

    if (
      Number.isNaN(parsedRecurrenceDay) ||
      parsedRecurrenceDay < 1 ||
      parsedRecurrenceDay > 31 ||
      !normalizedRecurrenceStartDate ||
      (recurrenceMode === "until-date" &&
        (!normalizedRecurrenceEndDate ||
          normalizedRecurrenceEndDate < normalizedRecurrenceStartDate)) ||
      (recurrenceMode === "for-months" &&
        (Number.isNaN(parsedRecurrenceMonths) || parsedRecurrenceMonths < 1))
    ) {
      return null;
    }

    return {
      title: normalizedTitle,
      amount: parsedAmount,
      type,
      category: normalizedCategory,
      transactionKind: "recurring-template",
      isRecurring: true,
      recurrenceType: "monthly",
      recurrenceMode,
      recurrenceDay: parsedRecurrenceDay,
      recurrenceStartDate: normalizedRecurrenceStartDate,
      recurrenceEndDate:
        recurrenceMode === "until-date" ? normalizedRecurrenceEndDate : null,
      recurrenceMonths:
        recurrenceMode === "for-months" ? parsedRecurrenceMonths : null,
    } satisfies LocalFinanceTransactionInput;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const transactionInput = buildTransactionInput();

    if (!transactionInput) {
      return;
    }

    try {
      await onAddTransaction(transactionInput);
      resetTransactionForm();
      onClearPreview();
    } catch {
      // A mensagem de erro é tratada no fluxo principal da página.
    }
  }

  function handlePreview() {
    const transactionInput = buildTransactionInput();

    if (!transactionInput) {
      return;
    }

    onPreviewTransaction(transactionInput);
  }

  return (
    <Card className="rounded-[1.5rem] border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Novo lançamento
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="space-y-4 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="transaction-title"
                  className="text-sm font-medium text-foreground"
                >
                  Título
                </label>

                <input
                  id="transaction-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className={inputClassName}
                  placeholder="Ex.: Aluguel, PIX, Salário"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="transaction-amount"
                  className="text-sm font-medium text-foreground"
                >
                  Valor
                </label>

                <input
                  id="transaction-amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className={inputClassName}
                  placeholder="Ex.: 250.00"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="transaction-type"
                  className="text-sm font-medium text-foreground"
                >
                  Natureza
                </label>

                <select
                  id="transaction-type"
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as TransactionType)
                  }
                  className={inputClassName}
                >
                  <option value="expense">Saída</option>
                  <option value="income">Entrada</option>
                </select>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="transaction-category"
                  className="text-sm font-medium text-foreground"
                >
                  Categoria
                </label>

                <select
                  id="transaction-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={inputClassName}
                  required
                >
                  {TRANSACTION_CATEGORIES.map((currentCategory) => (
                    <option key={currentCategory} value={currentCategory}>
                      {getTransactionCategoryLabel(currentCategory)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
            <label className="text-sm font-medium text-foreground">
              Tipo de lançamento
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: "single", label: "Único" },
                { value: "installment-template", label: "Parcelado" },
                { value: "recurring-template", label: "Recorrente" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setTransactionKind(option.value as TransactionEditorKind)
                  }
                  className={`rounded-[1.25rem] border px-4 py-3 text-sm font-medium transition ${
                    transactionKind === option.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-card/75 text-foreground hover:border-border"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>

          {transactionKind === "single" ? (
            <section className="space-y-3 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
              <div className="space-y-2">
                <label
                  htmlFor="transaction-date"
                  className="text-sm font-medium text-foreground"
                >
                  Data do lançamento
                </label>

                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    id="transaction-date"
                    type="date"
                    value={transactionDate}
                    onChange={(event) => setTransactionDate(event.target.value)}
                    className={`${inputClassName} pl-11`}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {transactionKind === "installment-template" ? (
            <section className="space-y-4 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="transaction-installment-count"
                    className="text-sm font-medium text-foreground"
                  >
                    Quantidade de parcelas
                  </label>

                  <input
                    id="transaction-installment-count"
                    type="number"
                    min="2"
                    value={installmentCount}
                    onChange={(event) =>
                      setInstallmentCount(event.target.value)
                    }
                    className={inputClassName}
                    placeholder="Ex.: 12"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="transaction-installment-start-date"
                    className="text-sm font-medium text-foreground"
                  >
                    Data da primeira parcela
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="transaction-installment-start-date"
                      type="date"
                      value={installmentStartDate}
                      onChange={(event) =>
                        setInstallmentStartDate(event.target.value)
                      }
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {transactionKind === "recurring-template" ? (
            <section className="space-y-4 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="transaction-recurrence-day"
                    className="text-sm font-medium text-foreground"
                  >
                    Dia da recorrência
                  </label>

                  <input
                    id="transaction-recurrence-day"
                    type="number"
                    min="1"
                    max="31"
                    value={recurrenceDay}
                    onChange={(event) => setRecurrenceDay(event.target.value)}
                    className={inputClassName}
                    placeholder="Ex.: 10"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="transaction-recurrence-start-date"
                    className="text-sm font-medium text-foreground"
                  >
                    Data de início
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="transaction-recurrence-start-date"
                      type="date"
                      value={recurrenceStartDate}
                      onChange={(event) =>
                        setRecurrenceStartDate(event.target.value)
                      }
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="transaction-recurrence-mode"
                  className="text-sm font-medium text-foreground"
                >
                  Até quando repetir
                </label>

                <select
                  id="transaction-recurrence-mode"
                  value={recurrenceMode}
                  onChange={(event) =>
                    setRecurrenceMode(
                      event.target.value as TransactionRecurrenceMode,
                    )
                  }
                  className={inputClassName}
                >
                  <option value="indefinite">Indefinido</option>
                  <option value="until-date">Até data</option>
                  <option value="for-months">Por quantidade de meses</option>
                </select>
              </div>

              {recurrenceMode === "until-date" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="transaction-recurrence-end-date"
                    className="text-sm font-medium text-foreground"
                  >
                    Data final
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="transaction-recurrence-end-date"
                      type="date"
                      min={recurrenceStartDate}
                      value={recurrenceEndDate}
                      onChange={(event) =>
                        setRecurrenceEndDate(event.target.value)
                      }
                      className={`${inputClassName} pl-11`}
                    />
                  </div>
                </div>
              ) : null}

              {recurrenceMode === "for-months" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="transaction-recurrence-months"
                    className="text-sm font-medium text-foreground"
                  >
                    Quantidade de meses
                  </label>

                  <input
                    id="transaction-recurrence-months"
                    type="number"
                    min="1"
                    value={recurrenceMonths}
                    onChange={(event) =>
                      setRecurrenceMonths(event.target.value)
                    }
                    className={inputClassName}
                    placeholder="Ex.: 6"
                  />
                </div>
              ) : null}
            </section>
          ) : null}

          <section className="space-y-3 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                className="h-11 flex-1 rounded-2xl"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar lançamento"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="h-11 flex-1 rounded-2xl"
                onClick={handlePreview}
              >
                <Sparkles className="size-4" />
                Simular impacto
              </Button>
            </div>

            {showPreviewNotice && isPreviewActive ? (
              <div className="rounded-[1.25rem] border border-accent/60 bg-accent/25 p-4">
                <p className="text-sm font-medium text-foreground">
                  Simulação ativa
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  A previsão já está mostrando esse impacto sem salvar nada.
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  className="mt-2 h-10 rounded-xl px-0 hover:bg-transparent"
                  onClick={onClearPreview}
                >
                  Limpar simulação
                </Button>
              </div>
            ) : null}
          </section>
        </form>
      </CardContent>
    </Card>
  );
}
