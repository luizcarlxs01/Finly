import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalProgressModal } from "@/components/dashboard/goal-progress-modal";

const goal = { id: "one", title: "Reserva", currentAmount: 2000, targetAmount: 10000, category: "general", deadline: "2027-01-01", createdAt: "2026-01-01" };

describe("contribution preview", () => {
  it("previews without writing and sends the contribution, not the projected total", async () => {
    const user = userEvent.setup(); const onSave = vi.fn(async () => {});
    render(<GoalProgressModal goal={goal} mode="add" open onSave={onSave} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Depois").closest("[aria-hidden]" )).toHaveAttribute("aria-hidden", "true");
    await user.type(screen.getByLabelText("Valor do aporte"), "500");
    await waitFor(() => expect(screen.getByText("Depois").closest("[aria-hidden]")).toBeNull());
    await waitFor(() => expect(screen.getByRole("img").getAttribute("aria-label")).toContain("25%"));
    expect(onSave).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Adicionar valor" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({ id: "one", currentAmount: 500 });
  });
  it("confirms the latest input without waiting for the preview debounce", async () => {
    const user = userEvent.setup(); const onSave = vi.fn(async () => {});
    render(<GoalProgressModal goal={goal} mode="add" open onSave={onSave} onOpenChange={vi.fn()} />);
    await user.click(screen.getByLabelText("Valor do aporte"));
    await user.paste("R$ 1.234,56");
    await user.click(screen.getByRole("button", { name: "Adicionar valor" }));
    expect(onSave).toHaveBeenCalledExactlyOnceWith({ id: "one", currentAmount: 1234.56 });
  });

  it("keeps invalid previews stable and validates before saving", async () => {
    const user = userEvent.setup(); const onSave = vi.fn();
    render(<GoalProgressModal goal={goal} mode="add" open onSave={onSave} onOpenChange={vi.fn()} />);
    await user.type(screen.getByLabelText("Valor do aporte"), "-10");
    expect(screen.getByRole("img").getAttribute("aria-label")?.replace(/\s/g, " ")).toContain("Depois: R$ 2.000,00, 20%");
    await user.click(screen.getByRole("button", { name: "Adicionar valor" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
  it("blocks duplicate submissions and keeps the dialog after a failed write", async () => {
    const user = userEvent.setup(); let reject!: (error: Error) => void;
    const onSave = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
    render(<GoalProgressModal goal={goal} mode="add" open onSave={onSave} onOpenChange={vi.fn()} />);
    expect(screen.getByText("Depois").closest("[aria-hidden]" )).toHaveAttribute("aria-hidden", "true");
    await user.type(screen.getByLabelText("Valor do aporte"), "500");
    await waitFor(() => expect(screen.getByText("Depois").closest("[aria-hidden]")).toBeNull());
    await user.dblClick(screen.getByRole("button", { name: "Adicionar valor" }));
    expect(onSave).toHaveBeenCalledOnce();
    reject(new Error("Falha"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
