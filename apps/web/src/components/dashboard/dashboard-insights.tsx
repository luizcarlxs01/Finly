import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardInsight,
  DashboardInsightTone,
} from "@/utils/dashboard-insights";

type DashboardInsightsProps = {
  insights: DashboardInsight[];
};

const toneClasses: Record<DashboardInsightTone, string> = {
  neutral: "border-border/70 bg-background/70",
  positive: "border-green-200 bg-green-50/60",
  warning: "border-amber-200 bg-amber-50/70",
};

export function DashboardInsights({ insights }: DashboardInsightsProps) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-2 border-b border-border/60 pb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Insights
        </p>
        <CardTitle className="text-2xl font-semibold tracking-tight">
          Leitura automática da sua dashboard
        </CardTitle>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Observações simples e objetivas com base nas movimentações e metas já
          registradas localmente.
        </p>
      </CardHeader>

      <CardContent className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-5">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`rounded-2xl border p-5 ${toneClasses[insight.tone]}`}
          >
            <p className="text-sm font-medium text-muted-foreground">
              {insight.title}
            </p>
            <p className="mt-3 text-sm leading-6 text-foreground/85">
              {insight.description}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
