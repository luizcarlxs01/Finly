import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { FinanceSummaryCard } from "@/components/dashboard/finance-summary-card";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function renderFinanceSummaryCard(
  overrides: Partial<React.ComponentProps<typeof FinanceSummaryCard>> = {},
) {
  const props: React.ComponentProps<typeof FinanceSummaryCard> = {
    initialBalance: 1000,
    totalIncome: 2500,
    totalExpense: 900,
    currentBalance: 2600,
    forecastTotalIncome: 2500,
    forecastTotalExpense: 900,
    forecastProjectedBalance: 2600,
    isPreviewActive: false,
    onClearPreview: vi.fn(),
    onUpdateInitialBalance: vi.fn(),
    nextUpcomingMonthLabel: null,
    ...overrides,
  };

  return {
    ...render(<FinanceSummaryCard {...props} />),
    props,
  };
}

function getCard() {
  return screen.getByText("Resumo financeiro").closest(
    '[data-slot="card"]',
  ) as HTMLElement | null;
}

function getByExactText(scope: ReturnType<typeof within>, value: string) {
  return scope.getByText(
    (_: string, element: Element | null) =>
      element?.textContent === value && (element.children.length ?? 0) === 0,
  );
}

function getAllByExactText(scope: ReturnType<typeof within>, value: string) {
  return scope.getAllByText(
    (_: string, element: Element | null) =>
      element?.textContent === value && (element.children.length ?? 0) === 0,
  );
}

describe("FinanceSummaryCard", () => {
  it("deve renderizar o card com dados validos e exibir as metricas principais", () => {
    renderFinanceSummaryCard();

    expect(screen.getByText("Resumo financeiro")).toBeInTheDocument();
    expect(screen.getByText("Saldo atual")).toBeInTheDocument();
    expect(screen.getByText("Entradas")).toBeInTheDocument();
    expect(screen.getByText("Saídas")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Alterar saldo" }),
    ).toBeInTheDocument();

    const scope = within(getCard()!);

    expect(getByExactText(scope, currencyFormatter.format(2600))).toBeInTheDocument();
    expect(getByExactText(scope, currencyFormatter.format(2500))).toBeInTheDocument();
    expect(getByExactText(scope, currencyFormatter.format(900))).toBeInTheDocument();
    expect(
      screen.getByText(
        (_: string, element: Element | null) =>
          element?.textContent === `Base inicial: ${currencyFormatter.format(1000)}`,
      ),
    ).toBeInTheDocument();
  });

  it("deve renderizar de forma estavel com dados minimos validos", () => {
    renderFinanceSummaryCard({
      initialBalance: 0,
      totalIncome: 0,
      totalExpense: 0,
      currentBalance: 0,
      forecastTotalIncome: 0,
      forecastTotalExpense: 0,
      forecastProjectedBalance: 0,
    });

    const scope = within(getCard()!);

    expect(getAllByExactText(scope, currencyFormatter.format(0))).toHaveLength(3);
    expect(
      screen.getByText(
        (_: string, element: Element | null) =>
          element?.textContent === `Base inicial: ${currencyFormatter.format(0)}`,
      ),
    ).toBeInTheDocument();
  });

  it("deve refletir valores negativos e zerados de forma observavel quando fizer parte dos dados recebidos", () => {
    renderFinanceSummaryCard({
      initialBalance: 200,
      totalIncome: 0,
      totalExpense: 500,
      currentBalance: -300,
      forecastTotalIncome: 0,
      forecastTotalExpense: 500,
      forecastProjectedBalance: -300,
    });

    const scope = within(getCard()!);

    expect(getByExactText(scope, currencyFormatter.format(-300))).toBeInTheDocument();
    expect(getByExactText(scope, currencyFormatter.format(0))).toBeInTheDocument();
    expect(getByExactText(scope, currencyFormatter.format(500))).toBeInTheDocument();
  });

  it("deve exibir a simulacao no proprio resumo quando estiver ativa", () => {
    renderFinanceSummaryCard({
      isPreviewActive: true,
      forecastTotalIncome: 3100,
      forecastTotalExpense: 1200,
      forecastProjectedBalance: 2900,
    });

    const scope = within(getCard()!);

    expect(screen.getByText("Simulação ativa")).toBeInTheDocument();
    expect(getByExactText(scope, currencyFormatter.format(2900))).toBeInTheDocument();
    expect(getByExactText(scope, currencyFormatter.format(3100))).toBeInTheDocument();
    expect(getByExactText(scope, currencyFormatter.format(1200))).toBeInTheDocument();
  });
});
