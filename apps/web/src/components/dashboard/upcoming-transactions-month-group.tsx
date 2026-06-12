import type { UpcomingTransactionsMonthGroup } from "@/utils/upcoming-transactions";
import { formatBusinessDateBr } from "@/utils/date-format";

type UpcomingTransactionsMonthGroupProps = {
  group: UpcomingTransactionsMonthGroup;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function formatCompetency(dateValue: string) {
  return formatBusinessDateBr(dateValue) ?? dateValue;
}

function getTypeLabel(type: "income" | "expense") {
  return type === "income" ? "Entrada" : "Saída";
}

const toneClasses: Record<
  UpcomingTransactionsMonthGroup["balanceTone"],
  {
    summaryContainer: string;
    summaryBadge: string;
    summaryBalance: string;
    balanceCard: string;
  }
> = {
  positive: {
    summaryContainer: "border-primary/20 bg-primary/10",
    summaryBadge: "bg-primary/15 text-primary",
    summaryBalance: "text-primary",
    balanceCard: "border-primary/20 bg-white/75",
  },
  neutral: {
    summaryContainer: "border-border/70 bg-card/90",
    summaryBadge: "bg-muted text-muted-foreground",
    summaryBalance: "text-foreground",
    balanceCard: "border-border/70 bg-card/80",
  },
  warning: {
    summaryContainer: "border-accent/60 bg-accent/25",
    summaryBadge: "bg-accent/55 text-foreground",
    summaryBalance: "text-foreground",
    balanceCard: "border-accent/60 bg-white/70",
  },
};

function getBalanceToneLabel(
  tone: UpcomingTransactionsMonthGroup["balanceTone"],
) {
  if (tone === "warning") {
    return "Atenção";
  }

  if (tone === "positive") {
    return "Folga prevista";
  }

  return "Mês apertado";
}

export function UpcomingTransactionsMonthGroup({
  group,
}: UpcomingTransactionsMonthGroupProps) {
  const toneClass = toneClasses[group.balanceTone];

  return (
    <section className="space-y-4">
      <div
        className={`rounded-[1.5rem] border p-5 sm:p-6 ${toneClass.summaryContainer}`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-semibold capitalize text-foreground">
                {group.monthLabel}
              </h3>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${toneClass.summaryBadge}`}
              >
                {getBalanceToneLabel(group.balanceTone)}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                {group.items.length} lançamento
                {group.items.length === 1 ? "" : "s"} previsto
                {group.items.length === 1 ? "" : "s"}
              </p>

              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {group.balanceSummary}
              </p>
            </div>
          </div>

          <div
            className={`min-w-[220px] rounded-[1.25rem] border px-4 py-4 ${toneClass.balanceCard}`}
          >
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Saldo previsto do mês
            </p>
            <p className={`mt-2 text-2xl font-semibold ${toneClass.summaryBalance}`}>
              {currencyFormatter.format(group.projectedBalance)}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Entradas
            </p>
            <p className="mt-1 text-base font-semibold text-primary">
              {currencyFormatter.format(group.totalIncome)}
            </p>
          </div>

          <div className="rounded-2xl border border-accent/60 bg-accent/25 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Saídas
            </p>
            <p className="mt-1 text-base font-semibold text-foreground">
              {currencyFormatter.format(group.totalExpense)}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Saldo previsto
            </p>
            <p className={`mt-1 text-base font-semibold ${toneClass.summaryBalance}`}>
              {currencyFormatter.format(group.projectedBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {group.items.map((item) => {
          const isIncome = item.type === "income";

          return (
            <article
              key={item.id}
              className="rounded-[1.5rem] border border-border/70 bg-card/90 p-4 shadow-sm transition-colors hover:bg-card"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0 space-y-3">
                  <div className="space-y-1">
                    <h4 className="truncate text-base font-semibold text-foreground">
                      {item.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Competência prevista: {formatCompetency(item.occurrenceDate)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        isIncome
                          ? "bg-primary/12 text-primary"
                          : "bg-accent/55 text-foreground"
                      }`}
                    >
                      {getTypeLabel(item.type)}
                    </span>

                    <span className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-foreground/80">
                      {item.marker}
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  <p
                    className={`text-lg font-semibold ${
                      isIncome ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {currencyFormatter.format(item.amount)}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
