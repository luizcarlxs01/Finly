import type { UpcomingTransactionsMonthGroup } from "@/utils/upcoming-transactions";

type UpcomingTransactionsMonthGroupProps = {
  group: UpcomingTransactionsMonthGroup;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

function formatCompetency(dateValue: string) {
  const [year, month, day] = dateValue.split("-").map(Number);

  return dateFormatter.format(new Date(year, month - 1, day, 12));
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
    summaryContainer: "border-green-200 bg-green-50/70",
    summaryBadge: "bg-green-100 text-green-800",
    summaryBalance: "text-green-800",
    balanceCard: "border-green-200/80 bg-green-50/80",
  },
  neutral: {
    summaryContainer: "border-border/70 bg-card/90",
    summaryBadge: "bg-muted text-muted-foreground",
    summaryBalance: "text-foreground",
    balanceCard: "border-border/70 bg-card/80",
  },
  warning: {
    summaryContainer: "border-amber-200 bg-amber-50/80",
    summaryBadge: "bg-amber-100 text-amber-900",
    summaryBalance: "text-amber-900",
    balanceCard: "border-amber-200/80 bg-amber-50/80",
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
          <div className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Entradas
            </p>
            <p className="mt-1 text-base font-semibold text-green-700">
              {currencyFormatter.format(group.totalIncome)}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/75 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Saídas
            </p>
            <p className="mt-1 text-base font-semibold text-red-700">
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
        {group.items.map((item) => (
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
                      item.type === "income"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
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
                    item.type === "income" ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {currencyFormatter.format(item.amount)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
