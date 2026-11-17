import type {
  DashboardInsight,
  DashboardInsightTone,
} from "@/utils/dashboard-insights";

type DashboardInsightsProps = {
  insights: DashboardInsight[];
};

const badgeClasses: Record<DashboardInsightTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  positive: "bg-primary/10 text-primary",
  warning: "bg-accent/25 text-foreground",
};

function getToneLabel(tone: DashboardInsightTone) {
  if (tone === "positive") return "Bom sinal";
  if (tone === "warning") return "Vale atenção";
  return "No radar";
}

export function DashboardInsights({ insights }: DashboardInsightsProps) {
  return (
    <div data-insights-grid className="grid h-full min-h-0 auto-rows-fr grid-cols-2 gap-2">
      {insights.map((insight) => (
        <article
          key={insight.id}
          className="flex min-h-0 flex-col gap-1 overflow-hidden rounded-2xl border border-border/50 bg-card/55 p-3 text-card-foreground shadow-sm backdrop-blur-xl"
        >
          <h3
            className="min-w-0 overflow-hidden text-[13px] font-semibold leading-4 text-foreground"
            style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}
          >
            {insight.title}
          </h3>
          <p
            className="overflow-hidden text-[13px] leading-[18px] text-foreground/85"
            title={insight.description}
            style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}
          >
            {insight.description}
          </p>
          <span className={`mt-auto inline-flex w-fit shrink-0 self-end rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeClasses[insight.tone]}`}>
            {getToneLabel(insight.tone)}
          </span>
        </article>
      ))}
    </div>
  );
}
