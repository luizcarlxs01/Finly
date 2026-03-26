"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransactionType } from "@/types/transaction";
import {
  DEFAULT_TRANSACTION_CATEGORY,
  getTransactionCategoryLabel,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";

type TransactionFormProps = {
  initialBalance: number;
  onUpdateInitialBalance: (value: number) => void;
  onAddTransaction: (input: {
    title: string;
    amount: number;
    type: TransactionType;
    category: string;
  }) => void;
};

const inputClassName =
  "w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function TransactionForm({
  initialBalance,
  onUpdateInitialBalance,
  onAddTransaction,
}: TransactionFormProps) {
  const [balanceInput, setBalanceInput] = useState(String(initialBalance));
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState(DEFAULT_TRANSACTION_CATEGORY);

  function handleSaveInitialBalance() {
    const parsedValue = Number(balanceInput);

    if (Number.isNaN(parsedValue)) {
      return;
    }

    onUpdateInitialBalance(parsedValue);
  }

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

    onAddTransaction({
      title: normalizedTitle,
      amount: parsedAmount,
      type,
      category: normalizedCategory,
    });

    setTitle("");
    setAmount("");
    setType("expense");
    setCategory(DEFAULT_TRANSACTION_CATEGORY);
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
            Preencha os dados abaixo para manter seu extrato atualizado com mais
            contexto e organização.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
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

            <Button type="submit" className="h-11 w-full">
              Adicionar transação
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
