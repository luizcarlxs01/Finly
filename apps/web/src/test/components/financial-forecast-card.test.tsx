import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";

import { FinancialForecastCard } from "@/components/dashboard/financial-forecast-card";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function renderFinancialForecastCard(
  overrides: Partial<React.ComponentProps<typeof FinancialForecastCard>> = {},
) {
  const props: React.ComponentProps<typeof FinancialForecastCard> = {
    totalIncome: 3200,
    totalExpense: 1800,
    projectedBalance: 1400,
    ...overrides,
  };

  return {
    ...render(<FinancialForecastCard {...props} />),
    props,
  };
}

function getByExactText(scope: ReturnType<typeof within>, value: string) {
  return scope.getByText(
    (_, element) =>
      element?.textContent === value && (element.children.length ?? 0) === 0,
  );
}

function getAllByExactText(scope: ReturnType<typeof within>, value: string) {
  return scope.getAllByText(
    (_, element) =>
      element?.textContent === value && (element.children.length ?? 0) === 0,
  );
}

describe("FinancialForecastCard", () => {
  it("deve renderizar o card com dados validos e as informacoes principais da previsao", () => {
    renderFinancialForecastCard();

    expect(screen.getByText("Próximo período")).toBeInTheDocument();
    expect(
      screen.getByText("Um olhar rápido para o que pode vir pela frente."),
    ).toBeInTheDocument();
    expect(screen.getByText("Saldo previsto")).toBeInTheDocument();
    expect(screen.getByText("Folga")).toBeInTheDocument();
    expect(screen.getByText("Entradas")).toBeInTheDocument();
    expect(screen.getByText("Saídas")).toBeInTheDocument();

    const card = screen.getByText("Saldo previsto").closest('[data-slot="card"]');
    expect(card).not.toBeNull();

    const scope = within(card!);

    expect(
      getByExactText(scope, currencyFormatter.format(1400)),
    ).toBeInTheDocument();
    expect(
      getByExactText(scope, currencyFormatter.format(3200)),
    ).toBeInTheDocument();
    expect(
      getByExactText(scope, currencyFormatter.format(1800)),
    ).toBeInTheDocument();
  });

  it("deve renderizar de forma estavel com dados minimos validos", () => {
    renderFinancialForecastCard({
      totalIncome: 0,
      totalExpense: 0,
      projectedBalance: 0,
    });

    expect(screen.getByText("Próximo período")).toBeInTheDocument();
    expect(screen.getByText("Em dia")).toBeInTheDocument();
    expect(screen.getByText("Entradas")).toBeInTheDocument();
    expect(screen.getByText("Saídas")).toBeInTheDocument();

    const card = screen.getByText("Saldo previsto").closest('[data-slot="card"]');
    expect(card).not.toBeNull();

    const scope = within(card!);

    expect(getAllByExactText(scope, currencyFormatter.format(0))).toHaveLength(3);
  });

  it("deve refletir visualmente o cenario de atencao quando o saldo previsto for negativo", () => {
    renderFinancialForecastCard({
      totalIncome: 1000,
      totalExpense: 1800,
      projectedBalance: -800,
    });

    expect(screen.getByText("Atenção")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === currencyFormatter.format(-800)),
    ).toBeInTheDocument();
  });

  it("deve refletir visualmente o cenario neutro quando o saldo previsto for zero", () => {
    renderFinancialForecastCard({
      totalIncome: 2500,
      totalExpense: 2500,
      projectedBalance: 0,
    });

    expect(screen.getByText("Em dia")).toBeInTheDocument();

    const card = screen.getByText("Saldo previsto").closest('[data-slot="card"]');
    expect(card).not.toBeNull();

    const scope = within(card!);

    expect(getAllByExactText(scope, currencyFormatter.format(2500))).toHaveLength(2);
    expect(getByExactText(scope, currencyFormatter.format(0))).toBeInTheDocument();
  });
});
