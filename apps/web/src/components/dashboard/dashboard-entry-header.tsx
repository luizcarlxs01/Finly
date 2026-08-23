
import { HeroSection } from "@/components/dashboard/hero-section";

type DashboardEntryHeaderProps = {
  onStartTransactions: () => void;
  onOpenCalendar: () => void;
  onOpenStatementProjection: () => void;
};

export function DashboardEntryHeader({
  onStartTransactions,
}: DashboardEntryHeaderProps) {
  return (
    <section id="inicio" className="space-y-6 lg:space-y-8">
      <HeroSection onStartTransactions={onStartTransactions} />

    </section>
  );
}
