import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FinancialCalendarModal } from "@/components/dashboard/overlays/financial-calendar-modal";
import type { Transaction } from "@/types/transaction";
const row = (i: number, date: string, type: "income" | "expense" = "expense", paid = true) => ({ id: String(i), title: "Lançamento " + i, amount: 10, category: "geral", type, occurrenceStatus: paid ? "paid" : "pending", occurrenceDate: date, createdAt: "2026-10-01T12:00:00Z", transactionKind: "single" }) as Transaction;
beforeEach(() => {
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };

});
afterEach(() => vi.restoreAllMocks());
describe("modal do calendário", () => {
  it("seleciona dias vazios e com todos os lançamentos, preserva os totais e o botão Editar", async () => {
    const edit = vi.fn();
    const rows = [row(1, "2026-10-01", "income"), row(2, "2026-10-01"), row(3, "2026-10-01", "expense", false), row(4, "2026-10-01")];
    render(<FinancialCalendarModal open initialDate="2026-10-02" onClose={vi.fn()} transactions={rows} currentBalance={100} onEditTransaction={edit} />);
    expect(screen.getByRole("heading", { name: "Calendário", level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Hoje" })).not.toBeInTheDocument();
    expect(screen.getByText("Sem lançamentos neste dia.")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Dia 1 — 4 lançamentos" });
    expect(button.querySelectorAll('[data-kind]')).toHaveLength(3);
    expect(within(button).getByLabelText("Mais 1 lançamento")).toBeInTheDocument();
    await userEvent.click(button);
    const list = screen.getByRole("list", { name: "Lista de lançamentos do dia" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
    const panel = screen.getByRole("region", { name: "Lançamentos do dia" });
    expect(panel.querySelector("footer")).toHaveTextContent("4 lançamentos · entradas R$ 10,00 · saídas R$ 30,00");
    expect(panel.querySelector("header")).not.toHaveTextContent("entradas");
    expect(screen.getByRole("heading", { name: "01/10/2026" })).toBeInTheDocument();
    const forecast = screen.getByRole("region", { name: "Previsão do mês" });
    expect(within(forecast).getByText(/90,00/)).toBeInTheDocument();
    await userEvent.click(within(list).getAllByRole("button", { name: "Editar" })[0]);
    expect(edit).toHaveBeenCalledWith(rows[0]);
    await userEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(screen.getByText("novembro de 2026")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Mês anterior" }));
    expect(screen.getByText("outubro de 2026")).toBeInTheDocument();
  });
  it("mantém a privacidade e o fechamento por botão e Esc", async () => {
    localStorage.setItem("finly:dashboard-values-hidden", "true");
    const close = vi.fn();
    const { rerender } = render(<FinancialCalendarModal open initialDate="2026-10-01" onClose={close} transactions={[row(1, "2026-10-01")]} currentBalance={100} onEditTransaction={vi.fn()} />);
    expect(within(screen.getByRole("region", { name: "Previsão do mês" })).getAllByText("••••••")).toHaveLength(3);
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveAttribute("data-closing", "true");
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    rerender(<FinancialCalendarModal key="reopened" open initialDate="2026-10-01" onClose={close} transactions={[]} currentBalance={100} onEditTransaction={vi.fn()} />);
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: true, cancelable: true }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(2));
  });
  it("fecha imediatamente quando o usuário prefere movimento reduzido", async () => {
    const original = window.matchMedia;
    vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: query.includes("prefers-reduced-motion") }));
    const close = vi.fn();
    render(<FinancialCalendarModal open onClose={close} transactions={[]} currentBalance={100} onEditTransaction={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(close).toHaveBeenCalledOnce();
    expect(screen.getByRole("dialog")).not.toHaveAttribute("data-closing");
  });
});
