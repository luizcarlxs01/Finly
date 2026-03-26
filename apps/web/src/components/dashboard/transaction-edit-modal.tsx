"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/types/finance";
import type { TransactionType } from "@/types/transaction";
import {
  getTransactionCategoryLabel,
  TRANSACTION_CATEGORIES,
} from "@/types/transaction-category";

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
  }) => void;
};

const fieldClassName =
  "w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

export function TransactionEditModal({
  transaction,
  open,
  onOpenChange,
  onSave,
}: TransactionEditModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [category, setCategory] = useState("geral");

  useEffect(() => {
    if (!transaction) {
      return;
    }

    setTitle(transaction.title);
    setAmount(String(transaction.amount));
    setType(transaction.type);
    setCategory(transaction.category);
  }, [transaction]);

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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!transaction) {
      return;
    }

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

    onSave({
      id: transaction.id,
      title: normalizedTitle,
      amount: parsedAmount,
      type,
      category: normalizedCategory,
    });

    onOpenChange(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
      <div className="w-full max-w-xl rounded-[1.75rem] border border-border/70 bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border/60 px-6 py-5">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Editar lançamento
            </p>
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">
              Atualizar transação
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Ajuste os dados da movimentação sem sair do extrato.
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
