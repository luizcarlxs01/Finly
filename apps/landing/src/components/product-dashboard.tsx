import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  MoreHorizontal,
  Target,
  TrendingUp,
  WalletCards,
} from "lucide-react";

const summary = [
  {
    label: "Entradas",
    value: "R$ 8.420",
    trend: "+12%",
    icon: ArrowDownLeft,
    tone: "positive",
  },
  {
    label: "Saídas",
    value: "R$ 4.180",
    trend: "-4%",
    icon: ArrowUpRight,
    tone: "neutral",
  },
  {
    label: "Saldo projetado",
    value: "R$ 6.890",
    trend: "+R$ 640",
    icon: TrendingUp,
    tone: "positive",
  },
] as const;

const chartBars = [38, 52, 46, 61, 56, 76, 88] as const;
const projectionBars = [34, 48, 43, 64, 72, 91] as const;

export function ProductDashboard() {
  return (
    <div className="dashboard-stage">
      <span className="dashboard-glow" aria-hidden="true" />
      <span className="dashboard-depth-plane" aria-hidden="true" />
      <div
        className="dashboard"
        role="group"
        aria-label="Exemplo visual do painel financeiro Finly"
      >
        <aside className="dashboard-sidebar" aria-hidden="true">
          <span className="dashboard-logo">
            <CircleDollarSign />
          </span>
          <span className="dashboard-side-item active">
            <LayoutDashboard />
          </span>
          <span className="dashboard-side-item">
            <WalletCards />
          </span>
          <span className="dashboard-side-item">
            <Target />
          </span>
        </aside>

        <div className="dashboard-main">
          <div className="dashboard-topbar">
            <div>
              <span className="dashboard-kicker">Visão geral</span>
              <strong>Olá, Luiz</strong>
            </div>
            <div className="dashboard-tools" aria-hidden="true">
              <span className="dashboard-period">
                Agosto <ChevronDown />
              </span>
              <span className="dashboard-bell">
                <Bell />
              </span>
              <span className="dashboard-avatar">LC</span>
            </div>
          </div>

          <section className="balance-card">
            <div className="balance-copy">
              <span>Saldo atual</span>
              <strong>R$ 12.480,00</strong>
              <small>
                <span aria-hidden="true" /> Atualizado agora
              </small>
            </div>
            <span className="balance-icon" aria-hidden="true">
              <WalletCards />
            </span>
          </section>

          <div className="summary-grid">
            {summary.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  className={`summary-card summary-card-${item.tone}`}
                  key={item.label}
                >
                  <div className="summary-heading">
                    <span>{item.label}</span>
                    <Icon aria-hidden="true" />
                  </div>
                  <strong>{item.value}</strong>
                  <small>{item.trend} este mês</small>
                </article>
              );
            })}
          </div>

          <div className="dashboard-detail-grid">
            <section
              className="chart-card"
              aria-label="Evolução financeira demonstrativa"
            >
              <div className="card-heading">
                <div>
                  <span>Fluxo mensal</span>
                  <strong>R$ 4.240</strong>
                </div>
                <MoreHorizontal aria-hidden="true" />
              </div>
              <div className="chart-area" aria-hidden="true">
                <span className="chart-baseline" />
                <div className="chart-bars">
                  {chartBars.map((height, index) => (
                    <span
                      className={index === chartBars.length - 1 ? "active" : ""}
                      key={`${height}-${index}`}
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
                <div className="chart-labels">
                  <span>Fev</span>
                  <span>Mar</span>
                  <span>Abr</span>
                  <span>Mai</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Ago</span>
                </div>
              </div>
            </section>

            <section className="goal-card">
              <div className="goal-icon" aria-hidden="true">
                <Target />
              </div>
              <span>Meta financeira</span>
              <strong>Reserva de tranquilidade</strong>
              <div className="goal-values">
                <span>R$ 13.600</span>
                <span>R$ 20.000</span>
              </div>
              <div
                className="goal-progress"
                role="progressbar"
                aria-label="Meta Reserva de tranquilidade"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={68}
              >
                <span />
              </div>
              <small>68% concluída</small>
            </section>
          </div>
        </div>
      </div>

      <div className="floating-metric floating-income" aria-hidden="true">
        <span>Entradas recentes</span>
        <strong>+ R$ 4.250</strong>
        <small>8,4% acima do mês passado</small>
      </div>

      <div className="floating-metric floating-goal" aria-hidden="true">
        <div className="floating-goal-heading">
          <span>Progresso</span>
          <strong>Meta 72%</strong>
        </div>
        <div className="floating-progress" aria-hidden="true">
          <span />
        </div>
      </div>

      <div className="floating-metric floating-projection" aria-hidden="true">
        <span>Saldo projetado para agosto</span>
        <strong>R$ 15.840</strong>
        <div className="floating-mini-chart" aria-hidden="true">
          {projectionBars.map((height, index) => (
            <span
              key={`${height}-${index}`}
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
