"use client";

import { useEffect, useRef, useState } from "react";

import { ArrowDownRight, ArrowUpRight, Sparkles, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FinanceSummaryCardProps = {
  initialBalance: number;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  forecastTotalIncome: number;
  forecastTotalExpense: number;
  forecastProjectedBalance: number;
  isPreviewActive: boolean;
  onClearPreview: () => void;
  onUpdateInitialBalance: (value: number) => void;
  nextUpcomingMonthLabel?: string | null;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function FinanceSummaryCard({
  initialBalance,
  totalIncome,
  totalExpense,
  currentBalance,
  forecastTotalIncome,
  forecastTotalExpense,
  forecastProjectedBalance,
  isPreviewActive,
  onClearPreview,
  onUpdateInitialBalance,
  nextUpcomingMonthLabel,
}: FinanceSummaryCardProps) {
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState(String(initialBalance));
  const cancelledRef = useRef(false);

  useEffect(() => {
    setBalanceInput(String(initialBalance));
  }, [initialBalance]);

  function handleSaveBalance() {
    if (cancelledRef.current) {
      cancelledRef.current = false;
      return;
    }
    const parsedValue = Number(balanceInput);
    if (!Number.isNaN(parsedValue)) {
      onUpdateInitialBalance(parsedValue);
    }
    setIsEditingBalance(false);
  }

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-card/95 text-card-foreground shadow-sm">
      <CardHeader className="space-y-1 pb-0">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Resumo financeiro
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 p-5 pt-4">
        <div className="rounded-[1.25rem] border border-border/60 bg-background/65 p-4">
          <div className="flex items-start justify-between gap-3">
            {isEditingBalance ? (
              <input
                autoFocus
                type="number"
                step="0.01"
                value={balanceInput}
                onChange={(e) => setBalanceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
                  if (e.key === "Escape") {
                    cancelledRef.current = true;
                    setBalanceInput(String(initialBalance));
                    setIsEditingBalance(false);
                  }
                }}
                onBlur={handleSaveBalance}
                className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/80 focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="Ex.: 1500.00"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingBalance(true)}
                className="group text-left"
                title="Clique para editar o saldo inicial"
              >
                <p className="text-sm text-muted-foreground">Saldo atual</p>
                <p className="mt-2 text-2xl font-semibold text-foreground transition-colors group-hover:text-primary">
                  {formatCurrency(currentBalance)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Base inicial: {formatCurrency(initialBalance)}
                </p>
              </button>
            )}

            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[1.25rem] border border-primary/15 bg-primary/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="mt-2 text-xl font-semibold text-primary">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <ArrowUpRight className="size-4.5 text-primary" />
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-accent/60 bg-accent/25 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatCurrency(totalExpense)}
                </p>
              </div>
              <ArrowDownRight className="size-4.5 text-foreground" />
            </div>
          </div>
        </div>

        {isPreviewActive ? (
          <div className="rounded-[1.25rem] border border-primary/20 bg-primary/8 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Simulação ativa
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  O impacto abaixo ainda não foi salvo.
                </p>
              </div>
              <Sparkles className="mt-0.5 size-4.5 text-primary" />
            </div>

            <div className="mt-4 grid gap-3">
              <div className="rounded-[1rem] border border-border/60 bg-background/70 p-3">
                <p className="text-xs text-muted-foreground">Saldo projetado</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {formatCurrency(forecastProjectedBalance)}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-[1rem] border border-border/60 bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">Entradas</p>
                  <p className="mt-1 text-base font-semibold text-primary">
                    {formatCurrency(forecastTotalIncome)}
                  </p>
                </div>

                <div className="rounded-[1rem] border border-border/60 bg-background/70 p-3">
                  <p className="text-xs text-muted-foreground">Saídas</p>
                  <p className="mt-1 text-base font-semibold text-foreground">
                    {formatCurrency(forecastTotalExpense)}
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              className="mt-3 h-9 rounded-xl px-0"
              onClick={onClearPreview}
            >
              Limpar simulação
            </Button>
          </div>
        ) : null}

        <div className="rounded-[1.25rem] border border-border/60 bg-muted/35 px-4 py-3">
          <p className="text-xs text-muted-foreground">Próximo período</p>
          <p className="mt-1 text-sm font-medium text-foreground">
            {nextUpcomingMonthLabel ?? "Sem lançamentos previstos"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
