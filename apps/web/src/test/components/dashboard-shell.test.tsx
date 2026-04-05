import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";

describe("DashboardShell", () => {
  it('deve renderizar a home quando activeView for "home"', () => {
    render(
      <DashboardShell
        activeView="home"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
      />,
    );

    expect(screen.getByText("Home View")).toBeInTheDocument();
    expect(screen.queryByText("Lançamentos View")).not.toBeInTheDocument();
    expect(screen.queryByText("Metas View")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights View")).not.toBeInTheDocument();
  });

  it('deve renderizar lançamentos quando activeView for "transactions"', () => {
    render(
      <DashboardShell
        activeView="transactions"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
      />,
    );

    expect(screen.getByText("Lançamentos View")).toBeInTheDocument();
    expect(screen.queryByText("Home View")).not.toBeInTheDocument();
    expect(screen.queryByText("Metas View")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights View")).not.toBeInTheDocument();
  });

  it('deve renderizar metas quando activeView for "goals"', () => {
    render(
      <DashboardShell
        activeView="goals"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
      />,
    );

    expect(screen.getByText("Metas View")).toBeInTheDocument();
    expect(screen.queryByText("Home View")).not.toBeInTheDocument();
    expect(screen.queryByText("Lançamentos View")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights View")).not.toBeInTheDocument();
  });

  it('deve renderizar insights quando activeView for "insights"', () => {
    render(
      <DashboardShell
        activeView="insights"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
      />,
    );

    expect(screen.getByText("Insights View")).toBeInTheDocument();
    expect(screen.queryByText("Home View")).not.toBeInTheDocument();
    expect(screen.queryByText("Lançamentos View")).not.toBeInTheDocument();
    expect(screen.queryByText("Metas View")).not.toBeInTheDocument();
  });
});
