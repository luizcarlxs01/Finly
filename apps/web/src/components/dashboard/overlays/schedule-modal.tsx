"use client";

import { CalendarDays, X } from "lucide-react";

import { UpcomingTransactions } from "@/components/dashboard/upcoming-transactions";
import { Button } from "@/components/ui/button";
import type { UpcomingTransactionsMonthGroup } from "@/utils/upcoming-transactions";

type ScheduleModalProps = {
  open: boolean;
  onClose: () => void;
  monthGroups: UpcomingTransactionsMonthGroup[];
};

export function ScheduleModal({
  open,
  onClose,
  monthGroups,
}: ScheduleModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/45 px-4 py-6 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-background shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:px-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Lançamentos
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Agenda financeira
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Consulte a agenda em um espaço dedicado, mantendo o mesmo
              comportamento atual da visualização por mês.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="rounded-2xl"
            onClick={onClose}
          >
            <X className="size-4" />
            Fechar
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="space-y-4 rounded-[1.5rem] border border-border/70 bg-card/70 p-4 sm:p-5">
            <div className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 bg-background/60 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </span>

              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Visualização da agenda
                </p>
                <p className="text-sm leading-6 text-muted-foreground">
                  Aqui você acompanha a agenda como ela já funciona hoje, sem
                  alterar a regra da aplicação.
                </p>
              </div>
            </div>

            <UpcomingTransactions monthGroups={monthGroups} />
          </div>
        </div>
      </div>
    </div>
  );
}
