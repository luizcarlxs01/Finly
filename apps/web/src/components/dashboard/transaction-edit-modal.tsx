"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/finance";
import type {
  TransactionKind,
  TransactionRecurrenceMode,
  TransactionRecurrenceType,
  TransactionType,
} from "@/types/transaction";
import {
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

type TransactionEditModalProps = {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (input: {
    id: string;
    title: string;
    amount: number;
    type: TransactionType;
    category: string;
    transactionKind?: TransactionKind;
    transactionDate?: string | null;
    isRecurring: boolean;
    recurrenceType: TransactionRecurrenceType | null;
    recurrenceMode?: TransactionRecurrenceMode | null;
    recurrenceDay: number | null;
    recurrenceStartDate: string | null;
    recurrenceEndDate?: string | null;
    recurrenceMonths?: number | null;
    installmentCount?: number | null;
    installmentStartDate?: string | null;
  }) => void;
};

const fieldClassName =
  "w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

function formatDateForInput(dateValue: string | null | undefined) {
  if (!dateValue) {
    return getTodayDateValue();
  }

  return dateValue.slice(0, 10);
}

function getEditorKind(transaction: Transaction | null): TransactionEditorKind {
  if (!transaction) {
    return "single";
  }

  if (transaction.transactionKind === "installment-template") {
    return "installment-template";
  }

  if (transaction.transactionKind === "recurring-template") {
    return "recurring-template";
  }

  return "single";
}

export function TransactionEditModal({
  transaction,
  open,
  onOpenChange,
  onSave,
}: TransactionEditModalProps) {
  const [title, setTitle] = useState(transaction?.title ?? "");
  const [amount, setAmount] = useState(transaction ? String(transaction.amount) : "");
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "expense");
  const [category, setCategory] = useState(transaction?.category ?? "geral");
  const [transactionKind, setTransactionKind] =
    useState<TransactionEditorKind>(getEditorKind(transaction));
  const [transactionDate, setTransactionDate] = useState(
    formatDateForInput(transaction?.createdAt),
  );
  const [installmentCount, setInstallmentCount] = useState(
    String(transaction?.installmentCount ?? 2),
  );
  const [installmentStartDate, setInstallmentStartDate] =
    useState(formatDateForInput(transaction?.installmentStartDate));
  const [recurrenceDay, setRecurrenceDay] = useState(
    String(transaction?.recurrenceDay ?? getTodayRecurrenceDay()),
  );
  const [recurrenceStartDate, setRecurrenceStartDate] =
    useState(formatDateForInput(transaction?.recurrenceStartDate));
  const [recurrenceMode, setRecurrenceMode] =
    useState<TransactionRecurrenceMode>(transaction?.recurrenceMode ?? "indefinite");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    formatDateForInput(transaction?.recurrenceEndDate),
  );
  const [recurrenceMonths, setRecurrenceMonths] = useState(
    String(transaction?.recurrenceMonths ?? 3),
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || !transaction) {
    return null;
  }

  const isRecurringInstance = transaction.transactionKind === "recurring-instance";
  const isInstallmentInstance =
    transaction.transactionKind === "installment-instance";
  const isGeneratedInstance = isRecurringInstance || isInstallmentInstance;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsedAmount = Number(amount);
    const normalizedTitle = title.trim();
    const normalizedCategory = category.trim();

    if (
      !normalizedTitle ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0 ||
      !normalizedCategory
    ) {
      return;
    }

    if (isGeneratedInstance) {
      onSave({
        id: transaction.id,
        title: normalizedTitle,
        amount: parsedAmount,
        type,
        category: normalizedCategory,
        transactionKind: transaction.transactionKind,
        isRecurring: false,
        recurrenceType: null,
        recurrenceDay: null,
        recurrenceStartDate: null,
      });

      onOpenChange(false);
      return;
    }

    if (transactionKind === "single") {
      const normalizedTransactionDate = transactionDate.trim();

      if (!normalizedTransactionDate) {
        return;
      }

      onSave({
        id: transaction.id,
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
      });

      onOpenChange(false);
      return;
    }

    if (transactionKind === "installment-template") {
      const parsedInstallmentCount = Number(installmentCount);
      const normalizedInstallmentStartDate = installmentStartDate.trim();

      if (
        Number.isNaN(parsedInstallmentCount) ||
        parsedInstallmentCount < 2 ||
        !normalizedInstallmentStartDate
      ) {
        return;
      }

      onSave({
        id: transaction.id,
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
      });

      onOpenChange(false);
      return;
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
      return;
    }

    onSave({
      id: transaction.id,
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
    });

    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-2xl rounded-[1.75rem] border border-border/70 bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Editar lançamento
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Atualizar transação
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Ajuste os dados sem sair da dashboard, mantendo clareza entre item
              único, parcelado e recorrente.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {!isGeneratedInstance ? (
            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Tipo do lançamento
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Escolha o comportamento correto desta transação para refletir o
                  domínio atual do Finly.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {(
                  [
                    {
                      value: "single",
                      title: "Único",
                      description: "Lançamento pontual com data específica.",
                    },
                    {
                      value: "installment-template",
                      title: "Parcelado",
                      description: "Gera parcelas mensais futuras.",
                    },
                    {
                      value: "recurring-template",
                      title: "Recorrente",
                      description: "Repete mensalmente com fim opcional.",
                    },
                  ] satisfies Array<{
                    value: TransactionEditorKind;
                    title: string;
                    description: string;
                  }>
                ).map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTransactionKind(option.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      transactionKind === option.value
                        ? "border-primary bg-primary/10"
                        : "border-border/70 bg-card/80 hover:border-border"
                    }`}
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {option.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {option.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
              <p className="text-sm font-medium text-foreground">
                Lançamento gerado automaticamente
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {isInstallmentInstance
                  ? "Esta transação é uma parcela gerada a partir de um plano parcelado. A configuração das parcelas deve ser ajustada no modelo original."
                  : "Esta transação é uma instância mensal gerada a partir de um modelo recorrente. A configuração da recorrência deve ser ajustada no modelo original."}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label
              htmlFor="edit-transaction-title"
              className="text-sm font-medium text-foreground"
            >
              Título
            </label>

            <input
              id="edit-transaction-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className={fieldClassName}
              placeholder="Ex.: Aluguel, Mercado, Salário"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="edit-transaction-amount"
              className="text-sm font-medium text-foreground"
            >
              Valor
            </label>

            <input
              id="edit-transaction-amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className={fieldClassName}
              placeholder="Ex.: 250.00"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="edit-transaction-type"
                className="text-sm font-medium text-foreground"
              >
                Tipo
              </label>

              <select
                id="edit-transaction-type"
                value={type}
                onChange={(event) =>
                  setType(event.target.value as TransactionType)
                }
                className={fieldClassName}
              >
                <option value="expense">Saída</option>
                <option value="income">Entrada</option>
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="edit-transaction-category"
                className="text-sm font-medium text-foreground"
              >
                Categoria
              </label>

              <select
                id="edit-transaction-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={fieldClassName}
              >
                {TRANSACTION_CATEGORIES.map((currentCategory) => (
                  <option key={currentCategory} value={currentCategory}>
                    {getTransactionCategoryLabel(currentCategory)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!isGeneratedInstance && transactionKind === "single" ? (
            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/60 p-4">
              <label
                htmlFor="edit-transaction-date"
                className="text-sm font-medium text-foreground"
              >
                Data
              </label>

              <input
                id="edit-transaction-date"
                type="date"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                className={fieldClassName}
              />
            </div>
          ) : null}

          {!isGeneratedInstance && transactionKind === "installment-template" ? (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Parcelamento
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Ajuste a quantidade e a primeira parcela. O Finly recalcula as
                  parcelas futuras automaticamente.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="edit-transaction-installment-count"
                    className="text-sm font-medium text-foreground"
                  >
                    Quantidade de parcelas
                  </label>

                  <input
                    id="edit-transaction-installment-count"
                    type="number"
                    min="2"
                    value={installmentCount}
                    onChange={(event) =>
                      setInstallmentCount(event.target.value)
                    }
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-transaction-installment-start-date"
                    className="text-sm font-medium text-foreground"
                  >
                    Data da primeira parcela
                  </label>

                  <input
                    id="edit-transaction-installment-start-date"
                    type="date"
                    value={installmentStartDate}
                    onChange={(event) =>
                      setInstallmentStartDate(event.target.value)
                    }
                    className={fieldClassName}
                  />
                </div>
              </div>
            </div>
          ) : null}

          {!isGeneratedInstance && transactionKind === "recurring-template" ? (
            <div className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Recorrência
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Atualize o dia da recorrência, a data de início e o modo de
                  duração.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="edit-transaction-recurrence-day"
                    className="text-sm font-medium text-foreground"
                  >
                    Dia da recorrência
                  </label>

                  <input
                    id="edit-transaction-recurrence-day"
                    type="number"
                    min="1"
                    max="31"
                    value={recurrenceDay}
                    onChange={(event) => setRecurrenceDay(event.target.value)}
                    className={fieldClassName}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="edit-transaction-recurrence-start-date"
                    className="text-sm font-medium text-foreground"
                  >
                    Data de início
                  </label>

                  <input
                    id="edit-transaction-recurrence-start-date"
                    type="date"
                    value={recurrenceStartDate}
                    onChange={(event) =>
                      setRecurrenceStartDate(event.target.value)
                    }
                    className={fieldClassName}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="edit-transaction-recurrence-mode"
                  className="text-sm font-medium text-foreground"
                >
                  Modo da recorrência
                </label>

                <select
                  id="edit-transaction-recurrence-mode"
                  value={recurrenceMode}
                  onChange={(event) =>
                    setRecurrenceMode(
                      event.target.value as TransactionRecurrenceMode,
                    )
                  }
                  className={fieldClassName}
                >
                  <option value="indefinite">Indefinido</option>
                  <option value="until-date">Até data</option>
                  <option value="for-months">Por quantidade de meses</option>
                </select>
              </div>

              {recurrenceMode === "until-date" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="edit-transaction-recurrence-end-date"
                    className="text-sm font-medium text-foreground"
                  >
                    Data final
                  </label>

                  <input
                    id="edit-transaction-recurrence-end-date"
                    type="date"
                    min={recurrenceStartDate}
                    value={recurrenceEndDate}
                    onChange={(event) =>
                      setRecurrenceEndDate(event.target.value)
                    }
                    className={fieldClassName}
                  />
                </div>
              ) : null}

              {recurrenceMode === "for-months" ? (
                <div className="space-y-2">
                  <label
                    htmlFor="edit-transaction-recurrence-months"
                    className="text-sm font-medium text-foreground"
                  >
                    Quantidade de meses
                  </label>

                  <input
                    id="edit-transaction-recurrence-months"
                    type="number"
                    min="1"
                    value={recurrenceMonths}
                    onChange={(event) =>
                      setRecurrenceMonths(event.target.value)
                    }
                    className={fieldClassName}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>

            <Button type="submit" className="rounded-xl">
              Salvar alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
