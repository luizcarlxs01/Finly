import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockUseLocalFinance = vi.fn();
const mockUseLocalGoals = vi.fn();
const mockGetDashboardInsights = vi.fn();
const mockGetUpcomingTransactionsByMonth = vi.fn();

vi.mock("@/hooks/use-local-finance", () => ({
  useLocalFinance: () => mockUseLocalFinance(),
}));

vi.mock("@/hooks/use-local-goals", () => ({
  useLocalGoals: () => mockUseLocalGoals(),
}));

vi.mock("@/utils/dashboard-insights", () => ({
  getDashboardInsights: (...args: unknown[]) => mockGetDashboardInsights(...args),
}));

vi.mock("@/utils/upcoming-transactions", () => ({
  getUpcomingTransactionsByMonth: (...args: unknown[]) =>
    mockGetUpcomingTransactionsByMonth(...args),
}));

vi.mock("@/components/dashboard/views/dashboard-home-view", () => ({
  DashboardHomeView: ({
    onGoToTransactions,
  }: {
    onGoToTransactions: () => void;
  }) => (
    <div>
      <p>HomeView</p>
      <button type="button" onClick={onGoToTransactions}>
        Ir para lançamentos
      </button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/views/dashboard-transactions-view", () => ({
  DashboardTransactionsView: ({
    currentBalance,
    filteredTransactions,
    statementTransactions,
    onEditTransaction,
    onRemoveTransaction,
  }: {
    currentBalance: number;
    filteredTransactions: Array<{ id: string; title: string }>;
    statementTransactions: Array<{ id: string; title: string }>;
    onEditTransaction: (transaction: { id: string; title: string }) => void;
    onRemoveTransaction: (id: string) => void;
  }) => (
    <div>
      <p>TransactionsView</p>
      <p>Saldo atual: {currentBalance}</p>
      <p>Filtradas: {filteredTransactions.length}</p>
      <button
        type="button"
        onClick={() => onEditTransaction(filteredTransactions[0])}
      >
        Editar primeira transação
      </button>
      <button
        type="button"
        onClick={() => onRemoveTransaction(statementTransactions[0].id)}
      >
        Remover primeira transação
      </button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/views/dashboard-goals-view", () => ({
  DashboardGoalsView: ({
    goals,
    totalGoalProgress,
    remainingGoalAmount,
    onUpdateProgress,
  }: {
    goals: Array<{ id: string; title: string }>;
    totalGoalProgress: number;
    remainingGoalAmount: number;
    onUpdateProgress: (goal: { id: string; title: string }) => void;
  }) => (
    <div>
      <p>GoalsView</p>
      <p>Metas: {goals.length}</p>
      <p>Progresso total: {totalGoalProgress}</p>
      <p>Falta: {remainingGoalAmount}</p>
      <button type="button" onClick={() => onUpdateProgress(goals[0])}>
        Atualizar primeira meta
      </button>
    </div>
  ),
}));

vi.mock("@/components/dashboard/views/dashboard-insights-view", () => ({
  DashboardInsightsView: ({
    insights,
    forecastProjectedBalance,
  }: {
    insights: Array<{ id: string; title: string }>;
    forecastProjectedBalance: number;
  }) => (
    <div>
      <p>InsightsView</p>
      <p>Insights: {insights.length}</p>
      <p>Saldo previsto: {forecastProjectedBalance}</p>
    </div>
  ),
}));

vi.mock("@/components/dashboard/transaction-edit-modal", () => ({
  TransactionEditModal: ({
    open,
    transaction,
    onOpenChange,
    onSave,
  }: {
    open: boolean;
    transaction: {
      id: string;
      title: string;
      amount: number;
      type: string;
      category: string;
    } | null;
    onOpenChange: (open: boolean) => void;
    onSave: (value: unknown) => void;
  }) =>
    open && transaction ? (
      <div>
        <p>TransactionEditModal</p>
        <p>Editando: {transaction.title}</p>
        <button
          type="button"
          onClick={() =>
            onSave({
              id: transaction.id,
              title: "Mercado editado",
              amount: transaction.amount,
              type: transaction.type,
              category: transaction.category,
              isRecurring: false,
              recurrenceType: null,
              recurrenceDay: null,
              recurrenceStartDate: null,
            })
          }
        >
          Salvar edição
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          Fechar edição
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/dashboard/goal-progress-modal", () => ({
  GoalProgressModal: ({
    open,
    goal,
    onOpenChange,
    onSave,
  }: {
    open: boolean;
    goal: { id: string; title: string } | null;
    onOpenChange: (open: boolean) => void;
    onSave: (value: unknown) => void;
  }) =>
    open && goal ? (
      <div>
        <p>GoalProgressModal</p>
        <p>Meta selecionada: {goal.title}</p>
        <button
          type="button"
          onClick={() => onSave({ id: goal.id, currentAmount: 800 })}
        >
          Salvar progresso
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          Fechar meta
        </button>
      </div>
    ) : null,
}));

vi.mock("@/components/ui/confirmation-modal", () => ({
  ConfirmationModal: ({
    open,
    onConfirm,
    onOpenChange,
  }: {
    open: boolean;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div>
        <p>ConfirmationModal</p>
        <button type="button" onClick={onConfirm}>
          Confirmar remoção
        </button>
        <button type="button" onClick={() => onOpenChange(false)}>
          Cancelar remoção
        </button>
      </div>
    ) : null,
}));

import HomePage from "@/app/page";

function createTransaction() {
  return {
    id: "tx-1",
    title: "Mercado",
    amount: 120,
    type: "expense" as const,
    category: "alimentacao",
    transactionKind: "single" as const,
    sourceId: null,
    occurrenceDate: null,
    installmentIndex: null,
    installmentCount: null,
    installmentStartDate: null,
    recurringSourceId: null,
    recurringOccurrenceDate: null,
    isRecurring: false,
    recurrenceType: null,
    recurrenceMode: null,
    recurrenceDay: null,
    recurrenceStartDate: null,
    recurrenceEndDate: null,
    recurrenceMonths: null,
    lastGeneratedAt: null,
    createdAt: "2026-04-10T12:00:00.000Z",
  };
}

function createGoal() {
  return {
    id: "goal-1",
    title: "Reserva",
    targetAmount: 1000,
    currentAmount: 200,
    category: "general",
    createdAt: "2026-04-10T12:00:00.000Z",
  };
}

function setupLoadedMocks(
  overrides?: {
    finance?: Record<string, unknown>;
    goals?: Record<string, unknown>;
  },
) {
  const finance = {
    initialBalance: 500,
    currentBalance: 1380,
    totalIncome: 2000,
    totalExpense: 1120,
    transactions: [createTransaction()],
    postedTransactions: [createTransaction()],
    getNextRecurringOccurrence: vi.fn(() => null),
    updateInitialBalance: vi.fn(),
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    removeTransaction: vi.fn(),
    createPreviewProfile: vi.fn(() => null),
    isLoaded: true,
    ...overrides?.finance,
  };

  const goals = {
    goals: [createGoal()],
    isLoaded: true,
    totalGoalTarget: 1000,
    totalGoalProgress: 200,
    addGoal: vi.fn(),
    updateGoalProgress: vi.fn(),
    removeGoal: vi.fn(),
    ...overrides?.goals,
  };

  mockUseLocalFinance.mockReturnValue(finance);
  mockUseLocalGoals.mockReturnValue(goals);
  mockGetDashboardInsights.mockReturnValue([
    { id: "insight-1", title: "Saldo estável", description: "ok", tone: "neutral" },
  ]);
  mockGetUpcomingTransactionsByMonth.mockReturnValue([
    { id: "month-1", monthLabel: "maio de 2026", items: [] },
  ]);

  return { finance, goals };
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve renderizar o estado de carregamento enquanto os hooks nao estiverem prontos", () => {
    mockUseLocalFinance.mockReturnValue({
      initialBalance: 0,
      currentBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      transactions: [],
      postedTransactions: [],
      getNextRecurringOccurrence: vi.fn(() => null),
      updateInitialBalance: vi.fn(),
      addTransaction: vi.fn(),
      updateTransaction: vi.fn(),
      removeTransaction: vi.fn(),
      createPreviewProfile: vi.fn(() => null),
      isLoaded: false,
    });
    mockUseLocalGoals.mockReturnValue({
      goals: [],
      totalGoalTarget: 0,
      totalGoalProgress: 0,
      addGoal: vi.fn(),
      updateGoalProgress: vi.fn(),
      removeGoal: vi.fn(),
      isLoaded: true,
    });
    mockGetDashboardInsights.mockReturnValue([]);
    mockGetUpcomingTransactionsByMonth.mockReturnValue([]);

    render(<HomePage />);

    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();
    expect(screen.queryByText("HomeView")).not.toBeInTheDocument();
  });

  it("deve renderizar a home por padrao e navegar entre as secoes principais", async () => {
    const user = userEvent.setup();

    setupLoadedMocks();

    render(<HomePage />);

    expect(screen.getByText("HomeView")).toBeInTheDocument();
    expect(screen.queryByText("TransactionsView")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Lançamentos$/i }));
    expect(screen.getByText("TransactionsView")).toBeInTheDocument();
    expect(screen.getByText("Saldo atual: 1380")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Metas$/i }));
    expect(screen.getByText("GoalsView")).toBeInTheDocument();
    expect(screen.getByText("Metas: 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Insights$/i }));
    expect(screen.getByText("InsightsView")).toBeInTheDocument();
    expect(screen.getByText("Insights: 1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Início$/i }));
    expect(screen.getByText("HomeView")).toBeInTheDocument();
  });

  it("deve manter renderizacao estavel com dados minimos validos", async () => {
    const user = userEvent.setup();

    setupLoadedMocks({
      finance: {
        initialBalance: 0,
        currentBalance: 0,
        totalIncome: 0,
        totalExpense: 0,
        transactions: [],
        postedTransactions: [],
      },
      goals: {
        goals: [],
        totalGoalTarget: 0,
        totalGoalProgress: 0,
      },
    });
    mockGetDashboardInsights.mockReturnValue([]);
    mockGetUpcomingTransactionsByMonth.mockReturnValue([]);

    render(<HomePage />);

    expect(screen.getByText("HomeView")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Lançamentos$/i }));
    expect(screen.getByText("TransactionsView")).toBeInTheDocument();
    expect(screen.getByText("Saldo atual: 0")).toBeInTheDocument();
    expect(screen.getByText("Filtradas: 0")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Insights$/i }));
    expect(screen.getByText("Insights: 0")).toBeInTheDocument();
    expect(screen.getByText("Saldo previsto: 0")).toBeInTheDocument();
  });

  it("deve permitir um fluxo util da home ate edicao e remocao de transacao", async () => {
    const user = userEvent.setup();
    const { finance } = setupLoadedMocks();

    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: "Ir para lançamentos" }));
    expect(screen.getByText("TransactionsView")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Editar primeira transação" }));
    expect(screen.getByText("TransactionEditModal")).toBeInTheDocument();
    expect(screen.getByText("Editando: Mercado")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar edição" }));
    expect(finance.updateTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "tx-1",
        title: "Mercado editado",
        amount: 120,
      }),
    );

    await user.click(screen.getByRole("button", { name: "Remover primeira transação" }));
    expect(screen.getByText("ConfirmationModal")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirmar remoção" }));
    expect(finance.removeTransaction).toHaveBeenCalledWith("tx-1");
  });

  it("deve abrir o modal de progresso de meta a partir da view de metas", async () => {
    const user = userEvent.setup();
    const { goals } = setupLoadedMocks();

    render(<HomePage />);

    await user.click(screen.getByRole("button", { name: /^Metas$/i }));
    expect(screen.getByText("GoalsView")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Atualizar primeira meta" }));
    expect(screen.getByText("GoalProgressModal")).toBeInTheDocument();
    expect(screen.getByText("Meta selecionada: Reserva")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Salvar progresso" }));
    expect(goals.updateGoalProgress).toHaveBeenCalledWith({
      id: "goal-1",
      currentAmount: 800,
    });
  });

  it("deve permitir cancelar uma remocao pendente sem excluir a transacao", async () => {
    const user = userEvent.setup();
    const { finance } = setupLoadedMocks();

    render(<HomePage />);

    await user.click(
      screen.getByRole("button", { name: /Ir para lan.*amentos/i }),
    );
    expect(screen.getByText("TransactionsView")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Remover primeira transa.*o/i }),
    );
    expect(screen.getByText("ConfirmationModal")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /Cancelar remo.*o/i }),
    );

    expect(screen.queryByText("ConfirmationModal")).not.toBeInTheDocument();
    expect(finance.removeTransaction).not.toHaveBeenCalled();
  });
});
