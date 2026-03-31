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
    container: string;
    badge: string;
    balance: string;
  }
> = {
  positive: {
    container: "border-green-200 bg-green-50/70",
    badge: "bg-green-100 text-green-800",
    balance: "text-green-800",
  },
  neutral: {
    container: "border-border/70 bg-card/90",
    badge: "bg-muted text-muted-foreground",
    balance: "text-foreground",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/80",
    badge: "bg-amber-100 text-amber-900",
    balance: "text-amber-900",
  },
};

export function UpcomingTransactionsMonthGroup({
  group,
}: UpcomingTransactionsMonthGroupProps) {
  const toneClass = toneClasses[group.balanceTone];

  return (
    <section className="rounded-[1.75rem] border border-border/70 bg-background/60 p-5">
      <div className="flex flex-col gap-4 border-b border-border/60 pb-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl font-semibold capitalize text-foreground">
                {group.monthLabel}
              </h3>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${toneClass.badge}`}
              >
                {group.balanceTone === "warning"
                  ? "Atenção"
                  : group.balanceTone === "positive"
                    ? "Folga prevista"
                    : "Mês apertado"}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              {group.items.length} lançamento{group.items.length === 1 ? "" : "s"} previsto
              {group.items.length === 1 ? "" : "s"}
            </p>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              {group.balanceSummary}
            </p>
          </div>

          <div className={`rounded-[1.5rem] border px-5 py-4 ${toneClass.container}`}>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Saldo previsto do mês
            </p>
            <p className={`mt-2 text-3xl font-semibold ${toneClass.balance}`}>
              {currencyFormatter.format(group.projectedBalance)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Entradas
            </p>
            <p className="mt-1 text-base font-semibold text-green-700">
              {currencyFormatter.format(group.totalIncome)}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Saídas
            </p>
            <p className="mt-1 text-base font-semibold text-red-700">
              {currencyFormatter.format(group.totalExpense)}
            </p>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card/80 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Saldo previsto
            </p>
            <p className={`mt-1 text-base font-semibold ${toneClass.balance}`}>
              {currencyFormatter.format(group.projectedBalance)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {group.items.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/90 p-4 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="space-y-2">
              <div className="space-y-1">
                <h4 className="text-base font-semibold text-foreground">
                  {item.title}
                </h4>
                <p className="text-sm text-muted-foreground">
                  Competência prevista: {formatCompetency(item.occurrenceDate)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  {getTypeLabel(item.type)}
                </span>

                <span className="inline-flex rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs font-medium text-foreground/80">
                  {item.marker}
                </span>
              </div>
            </div>

            <p
              className={`text-lg font-semibold ${
                item.type === "income" ? "text-green-700" : "text-red-700"
              }`}
            >
              {currencyFormatter.format(item.amount)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
