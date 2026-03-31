"use client";

import { useState } from "react";

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
  initialBalance: number;
  onUpdateInitialBalance: (value: number) => void;
  onAddTransaction: (input: LocalFinanceTransactionInput) => void;
  onPreviewTransaction: (input: LocalFinanceTransactionInput) => void;
  onClearPreview: () => void;
  isPreviewActive: boolean;
};

const inputClassName =
  "w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function TransactionForm({
  initialBalance,
  onUpdateInitialBalance,
  onAddTransaction,
  onPreviewTransaction,
  onClearPreview,
  isPreviewActive,
}: TransactionFormProps) {
  const [balanceInput, setBalanceInput] = useState(String(initialBalance));
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

  function handleSaveInitialBalance() {
    const parsedValue = Number(balanceInput);

    if (Number.isNaN(parsedValue)) {
      return;
    }

    onUpdateInitialBalance(parsedValue);
  }

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
    const todayDateValue = getTodayDateValue();

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
        !normalizedInstallmentStartDate ||
        normalizedInstallmentStartDate < todayDateValue
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
      normalizedRecurrenceStartDate < todayDateValue ||
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const transactionInput = buildTransactionInput();

    if (!transactionInput) {
      return;
    }

    onAddTransaction(transactionInput);

    resetTransactionForm();
    onClearPreview();
  }

  function handlePreview() {
    const transactionInput = buildTransactionInput();

    if (!transactionInput) {
      return;
    }

    onPreviewTransaction(transactionInput);
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-[1.75rem] border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="space-y-2 pb-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Base financeira
          </p>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Saldo inicial
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Defina o ponto de partida para a leitura correta da sua situação
            financeira.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="initial-balance"
              className="text-sm font-medium text-foreground"
            >
              Informe seu saldo atual
            </label>

            <input
              id="initial-balance"
              type="number"
              step="0.01"
              value={balanceInput}
              onChange={(event) => setBalanceInput(event.target.value)}
              className={inputClassName}
              placeholder="Ex.: 1500.00"
            />
          </div>

          <Button onClick={handleSaveInitialBalance} className="h-11 w-full">
            Salvar saldo inicial
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-[1.75rem] border-border/70 bg-card/95 shadow-sm">
        <CardHeader className="space-y-2 pb-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Novo lançamento
          </p>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Registrar transação
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Escolha o tipo de lançamento e preencha somente os campos
            necessários para manter a sua agenda financeira mais clara.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Tipo do lançamento
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Defina se este item é único, parcelado ou recorrente.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setTransactionKind("single")}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    transactionKind === "single"
                      ? "border-primary bg-primary/10"
                      : "border-border/70 bg-card/80 hover:border-border"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">Único</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Lançamento pontual com uma data específica.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTransactionKind("installment-template")}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    transactionKind === "installment-template"
                      ? "border-primary bg-primary/10"
                      : "border-border/70 bg-card/80 hover:border-border"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">
                    Parcelado
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Gera parcelas mensais futuras a partir da primeira data.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTransactionKind("recurring-template")}
                  className={`rounded-2xl border px-4 py-4 text-left transition ${
                    transactionKind === "recurring-template"
                      ? "border-primary bg-primary/10"
                      : "border-border/70 bg-card/80 hover:border-border"
                  }`}
                >
                  <p className="text-sm font-semibold text-foreground">
                    Recorrente
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Repete mensalmente com duração definida ou indefinida.
                  </p>
                </button>
              </div>
            </div>

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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor="transaction-type"
                  className="text-sm font-medium text-foreground"
                >
                  Tipo
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

            {transactionKind === "single" ? (
              <div className="space-y-2 rounded-2xl border border-border/60 bg-background/60 p-4">
                <label
                  htmlFor="transaction-date"
                  className="text-sm font-medium text-foreground"
                >
                  Data
                </label>

                <input
                  id="transaction-date"
                  type="date"
                  value={transactionDate}
                  onChange={(event) => setTransactionDate(event.target.value)}
                  className={inputClassName}
                />
              </div>
            ) : null}

            {transactionKind === "installment-template" ? (
              <div className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Parcelamento
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    O Finly vai gerar automaticamente as próximas parcelas mês a
                    mês a partir da primeira data informada.
                  </p>
                </div>

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

                    <input
                      id="transaction-installment-start-date"
                      type="date"
                      min={getTodayDateValue()}
                      value={installmentStartDate}
                      onChange={(event) =>
                        setInstallmentStartDate(event.target.value)
                      }
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {transactionKind === "recurring-template" ? (
              <div className="space-y-4 rounded-2xl border border-border/60 bg-background/60 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    Recorrência
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Configure a recorrência mensal e escolha se ela segue sem
                    fim, até uma data ou por uma quantidade de meses.
                  </p>
                </div>

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

                    <input
                      id="transaction-recurrence-start-date"
                      type="date"
                      min={getTodayDateValue()}
                      value={recurrenceStartDate}
                      onChange={(event) =>
                        setRecurrenceStartDate(event.target.value)
                      }
                      className={inputClassName}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="transaction-recurrence-mode"
                    className="text-sm font-medium text-foreground"
                  >
                    Modo da recorrência
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

                    <input
                      id="transaction-recurrence-end-date"
                      type="date"
                      min={recurrenceStartDate}
                      value={recurrenceEndDate}
                      onChange={(event) =>
                        setRecurrenceEndDate(event.target.value)
                      }
                      className={inputClassName}
                    />
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
              </div>
            ) : null}

            <Button type="submit" className="h-11 w-full">
              Adicionar transação
            </Button>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full"
                onClick={handlePreview}
              >
                Simular impacto
              </Button>

              {isPreviewActive ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
                  <p className="text-sm font-medium text-foreground">
                    Simulação ativa na projeção
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    A previsão mensal e os próximos lançamentos estão exibindo o
                    impacto desse item sem salvar nada.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-3 h-10 rounded-xl px-0 text-amber-900 hover:bg-transparent"
                    onClick={onClearPreview}
                  >
                    Limpar simulação
                  </Button>
                </div>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
