import { CalendarDays, FileText } from "lucide-react";

import { HeroSection } from "@/components/dashboard/hero-section";
import { Button } from "@/components/ui/button";

type DashboardEntryHeaderProps = {
  onStartTransactions: () => void;
  onOpenSchedule: () => void;
  onOpenStatementProjection: () => void;
};

export function DashboardEntryHeader({
  onStartTransactions,
  onOpenSchedule,
  onOpenStatementProjection,
}: DashboardEntryHeaderProps) {
  return (
    <section id="inicio" className="space-y-6 lg:space-y-8">
      <HeroSection onStartTransactions={onStartTransactions} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          className="h-11 justify-start rounded-2xl"
          onClick={onOpenSchedule}
        >
          <CalendarDays className="size-4" />
          Agenda
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-11 justify-start rounded-2xl"
          onClick={onOpenStatementProjection}
        >
          <FileText className="size-4" />
          Extrato
        </Button>
      </div>
    </section>
  );
}
