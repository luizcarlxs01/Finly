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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:px-6 sm:py-6 lg:px-8">
      <div className="flex max-h-[min(100dvh-0.5rem,96vh)] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-border/70 bg-background shadow-2xl sm:max-h-[92vh] sm:max-w-6xl sm:rounded-[1.75rem]">
        <div className="flex flex-col gap-4 border-b border-border/60 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              Agenda
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Veja o que está previsto para os próximos meses.
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

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="space-y-3 rounded-[1.5rem] border border-border/60 bg-card/70 p-4 sm:p-5">
            <div className="flex items-start gap-3 rounded-[1.25rem] border border-border/60 bg-background/55 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays className="size-5" />
              </span>

              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Próximos lançamentos
                </p>
                <p className="text-sm text-muted-foreground">
                  Uma visão simples do que está por vir.
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
