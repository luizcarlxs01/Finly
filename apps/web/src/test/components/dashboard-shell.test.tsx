import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";

describe("DashboardShell", () => {
  const views = {
    homeView: <div>Home</div>,
    transactionsView: <section data-shared-indicators data-eclipse-anchor><button>Ocultar valores</button><span>R$ 200,00</span></section>,
    goalsView: <section data-shared-indicators data-eclipse-anchor><span>3 metas</span></section>,
    insightsView: <div>Insights</div>, forumView: null, downloadView: null,
  };

  it("compartilha uma única superfície nos dois sentidos e a remove ao terminar", async () => {
    const { container, rerender } = render(<DashboardShell {...views} activeView="transactions" />);
    for (const activeView of ["goals", "transactions"] as const) {
      rerender(<DashboardShell {...views} activeView={activeView} />);
      expect(container.querySelectorAll('[data-indicator-transition]')).toHaveLength(1);
      expect(container.querySelector<HTMLElement>("[data-shared-indicators]")?.style.visibility).toBe("hidden");
      await waitFor(() => expect(container.querySelector('[data-indicator-transition]')).toBeNull());
      expect(container.querySelector<HTMLElement>("[data-shared-indicators]")?.style.visibility).toBe("");
    }
  });

  it("interrompe a transição e termina na última tela sem deixar cópias", async () => {
    const { container, rerender } = render(<DashboardShell {...views} activeView="transactions" />);
    for (const activeView of ["goals", "transactions", "goals"] as const) {
      rerender(<DashboardShell {...views} activeView={activeView} />);
      expect(container.querySelectorAll('[data-indicator-transition]')).toHaveLength(1);
    }
    await waitFor(() => expect(container.querySelector('[data-indicator-transition]')).toBeNull());
    expect(screen.getByText("3 metas")).toBeVisible();
    rerender(<DashboardShell {...views} activeView="goals" />);
    expect(container.querySelector('[data-indicator-transition]')).toBeNull();
    rerender(<DashboardShell {...views} activeView="transactions" />);
    rerender(<DashboardShell {...views} activeView="home" />);
    expect(container.querySelector('[data-indicator-transition]')).toBeNull();
  });

  it("troca diretamente com movimento reduzido", () => {
    const original = window.matchMedia;
    const media = vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: true }));
    try {
      const { container, rerender } = render(<DashboardShell {...views} activeView="transactions" />);
      rerender(<DashboardShell {...views} activeView="goals" />);
      expect(container.querySelector('[data-indicator-transition]')).toBeNull();
      expect(screen.getByText("3 metas")).toBeVisible();
    } finally { media.mockRestore(); }
  });

  it('deve renderizar a home quando activeView for "home"', () => {
    render(
      <DashboardShell
        activeView="home"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
        forumView={<div>Fórum View</div>}
        downloadView={<div>Download View</div>}
      />,
    );

    expect(screen.getByText("Home View")).toBeInTheDocument();
    expect(screen.queryByText("Lançamentos View")).not.toBeInTheDocument();
    expect(screen.queryByText("Metas View")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights View")).not.toBeInTheDocument();
    expect(screen.queryByText("Fórum View")).not.toBeInTheDocument();
    expect(screen.queryByText("Download View")).not.toBeInTheDocument();
  });

  it('deve renderizar lançamentos quando activeView for "transactions"', () => {
    render(
      <DashboardShell
        activeView="transactions"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
        forumView={<div>Fórum View</div>}
        downloadView={<div>Download View</div>}
      />,
    );

    expect(screen.getByText("Lançamentos View")).toBeInTheDocument();
    expect(screen.queryByText("Home View")).not.toBeInTheDocument();
    expect(screen.queryByText("Metas View")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights View")).not.toBeInTheDocument();
    expect(screen.queryByText("Fórum View")).not.toBeInTheDocument();
    expect(screen.queryByText("Download View")).not.toBeInTheDocument();
  });

  it('deve renderizar metas quando activeView for "goals"', () => {
    render(
      <DashboardShell
        activeView="goals"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
        forumView={<div>Fórum View</div>}
        downloadView={<div>Download View</div>}
      />,
    );

    expect(screen.getByText("Metas View")).toBeInTheDocument();
    expect(screen.queryByText("Home View")).not.toBeInTheDocument();
    expect(screen.queryByText("Lançamentos View")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights View")).not.toBeInTheDocument();
    expect(screen.queryByText("Fórum View")).not.toBeInTheDocument();
    expect(screen.queryByText("Download View")).not.toBeInTheDocument();
  });

  it('deve renderizar insights quando activeView for "insights"', () => {
    render(
      <DashboardShell
        activeView="insights"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
        forumView={<div>Fórum View</div>}
        downloadView={<div>Download View</div>}
      />,
    );

    expect(screen.getByText("Insights View")).toBeInTheDocument();
    expect(screen.queryByText("Home View")).not.toBeInTheDocument();
    expect(screen.queryByText("Lançamentos View")).not.toBeInTheDocument();
    expect(screen.queryByText("Metas View")).not.toBeInTheDocument();
    expect(screen.queryByText("Fórum View")).not.toBeInTheDocument();
    expect(screen.queryByText("Download View")).not.toBeInTheDocument();
  });

  it('deve renderizar o fórum quando activeView for "forum"', () => {
    render(
      <DashboardShell
        activeView="forum"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
        forumView={<div>Fórum View</div>}
        downloadView={<div>Download View</div>}
      />,
    );

    expect(screen.getByText("Fórum View")).toBeInTheDocument();
    expect(screen.queryByText("Home View")).not.toBeInTheDocument();
    expect(screen.queryByText("Lançamentos View")).not.toBeInTheDocument();
    expect(screen.queryByText("Metas View")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights View")).not.toBeInTheDocument();
    expect(screen.queryByText("Download View")).not.toBeInTheDocument();
  });

  it('deve renderizar o download quando activeView for "download"', () => {
    render(
      <DashboardShell
        activeView="download"
        homeView={<div>Home View</div>}
        transactionsView={<div>Lançamentos View</div>}
        goalsView={<div>Metas View</div>}
        insightsView={<div>Insights View</div>}
        forumView={<div>Fórum View</div>}
        downloadView={<div>Download View</div>}
      />,
    );

    expect(screen.getByText("Download View")).toBeInTheDocument();
    expect(screen.queryByText("Home View")).not.toBeInTheDocument();
    expect(screen.queryByText("Lançamentos View")).not.toBeInTheDocument();
    expect(screen.queryByText("Metas View")).not.toBeInTheDocument();
    expect(screen.queryByText("Insights View")).not.toBeInTheDocument();
    expect(screen.queryByText("Fórum View")).not.toBeInTheDocument();
  });

});

