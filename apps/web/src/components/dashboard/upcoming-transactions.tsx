"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { UpcomingTransactionsMonthGroup } from "@/components/dashboard/upcoming-transactions-month-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { UpcomingTransactionsMonthGroup as UpcomingTransactionsMonthGroupType } from "@/utils/upcoming-transactions";

type UpcomingTransactionsProps = {
  monthGroups: UpcomingTransactionsMonthGroupType[];
};

export function UpcomingTransactions({
  monthGroups,
}: UpcomingTransactionsProps) {
  const hasItems = monthGroups.some((group) => group.items.length > 0);

  const [activeIndex, setActiveIndex] = useState(0);

  const safeActiveIndex =
    monthGroups.length === 0
      ? 0
      : Math.min(activeIndex, monthGroups.length - 1);

  const activeGroup = monthGroups[safeActiveIndex];
  const canGoPrevious = safeActiveIndex > 0;
  const canGoNext = safeActiveIndex < monthGroups.length - 1;

  function handlePreviousMonth() {
    if (!canGoPrevious) {
      return;
    }

    setActiveIndex((current) => current - 1);
  }

  function handleNextMonth() {
    if (!canGoNext) {
      return;
    }

    setActiveIndex((current) => current + 1);
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Agenda
        </p>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Próximos lançamentos
            </CardTitle>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Navegue pelos próximos meses para entender parcelas e recorrências
              com mais foco, sem misturar previsão com o histórico do extrato.
            </p>
          </div>

          {hasItems && activeGroup ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Mês exibido
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {activeGroup.monthLabel}
                </p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Posição
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {safeActiveIndex + 1} de {monthGroups.length}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 p-6">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Leitura
            </p>
            <p className="mt-1 text-sm text-foreground">
              Um mês por vez, com visão mais objetiva do que está por vir
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Destaque
            </p>
            <p className="mt-1 text-sm text-foreground">
              Entradas, saídas e saldo previsto concentrados no mês ativo
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/70 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Navegação
            </p>
            <p className="mt-1 text-sm text-foreground">
              Avance ou volte entre os meses sem precisar rolar a tela inteira
            </p>
          </div>
        </div>

        {hasItems && activeGroup ? (
          <div className="space-y-5">
            <div className="flex flex-col gap-3 rounded-[1.75rem] border border-border/70 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Navegação da agenda
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  {activeGroup.monthLabel}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePreviousMonth}
                  disabled={!canGoPrevious}
                  className="rounded-2xl"
                >
                  <ChevronLeft />
                  Anterior
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleNextMonth}
                  disabled={!canGoNext}
                  className="rounded-2xl"
                >
                  Próximo
                  <ChevronRight />
                </Button>
              </div>
            </div>

            <UpcomingTransactionsMonthGroup group={activeGroup} />
          </div>
        ) : (
          <div className="rounded-[1.75rem] border border-dashed border-border/70 bg-background/60 p-8 text-center">
            <p className="text-base font-medium text-foreground">
              Nenhum lançamento futuro previsto
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Assim que houver parcelas ou recorrências futuras, elas aparecerão
              organizadas aqui por mês.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
