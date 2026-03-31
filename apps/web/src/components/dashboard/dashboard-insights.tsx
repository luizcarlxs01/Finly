import { Lightbulb, Sparkles } from "lucide-react";

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
    container: "border-border/70 bg-background/70",
    badge: "bg-muted text-muted-foreground",
  },
  positive: {
    container: "border-green-200 bg-green-50/60",
    badge: "bg-green-100 text-green-800",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/70",
    badge: "bg-amber-100 text-amber-900",
  },
};

function getToneLabel(tone: DashboardInsightTone) {
  if (tone === "positive") {
    return "Positivo";
  }

  if (tone === "warning") {
    return "Atenção";
  }

  return "Neutro";
}

export function DashboardInsights({ insights }: DashboardInsightsProps) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/95 shadow-sm">
      <CardHeader className="space-y-3 border-b border-border/60 pb-6">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <Sparkles className="size-3.5" />
          Insights
        </div>

        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Leitura automática da sua dashboard
          </CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Observações simples e objetivas com base nas movimentações e metas já
            registradas localmente.
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-6">
        <div className="rounded-[1.5rem] border border-border/70 bg-background/60 p-4">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lightbulb className="size-4.5" />
            </span>

            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                O que este bloco mostra
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                Pequenas leituras automáticas para ajudar você a perceber padrões,
                riscos e pontos positivos sem precisar interpretar tudo sozinho.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          {insights.map((insight) => {
            const toneClass = toneClasses[insight.tone];

            return (
              <article
                key={insight.id}
                className={`rounded-[1.5rem] border p-5 ${toneClass.container}`}
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-foreground">
                      {insight.title}
                    </h3>

                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${toneClass.badge}`}
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
