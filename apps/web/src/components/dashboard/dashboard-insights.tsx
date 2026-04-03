import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  DashboardInsight,
  DashboardInsightTone,
} from "@/utils/dashboard-insights";

type DashboardInsightsProps = {
  insights: DashboardInsight[];
};

const toneClasses: Record<
  DashboardInsightTone,
  {
    container: string;
    badge: string;
  }
> = {
  neutral: {
    container: "border-border/60 bg-background/65",
    badge: "bg-muted text-muted-foreground",
  },
  positive: {
    container: "border-green-200 bg-green-50/55",
    badge: "bg-green-100 text-green-800",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/65",
    badge: "bg-amber-100 text-amber-900",
  },
};

function getToneLabel(tone: DashboardInsightTone) {
  if (tone === "positive") {
    return "Bom sinal";
  }

  if (tone === "warning") {
    return "Vale atenção";
  }

  return "No radar";
}

export function DashboardInsights({ insights }: DashboardInsightsProps) {
  return (
    <Card className="overflow-hidden rounded-[1.75rem] border-border/60 bg-card/95 shadow-sm">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-semibold tracking-tight">
          Leituras rápidas
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sinais simples para te ajudar a entender o momento atual.
        </p>
      </CardHeader>

      <CardContent className="p-5 pt-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {insights.map((insight) => {
            const toneClass = toneClasses[insight.tone];

            return (
              <article
                key={insight.id}
                className={`rounded-[1.25rem] border p-4 ${toneClass.container}`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {insight.title}
                    </h3>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${toneClass.badge}`}
                    >
                      {getToneLabel(insight.tone)}
                    </span>
                  </div>

                  <p className="text-sm leading-6 text-foreground/85">
                    {insight.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
