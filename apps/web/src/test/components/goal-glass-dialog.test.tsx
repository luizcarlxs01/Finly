import { useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GoalGlassDialog } from "@/components/dashboard/goal-glass-dialog";

function Host({ empty = false }: { empty?: boolean }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <button ref={trigger} onClick={() => setOpen(true)}>Abrir formulário</button>
    <button>Fundo</button>
    {open && <GoalGlassDialog triggerRef={trigger} title="Formulário" onClose={() => setOpen(false)}>
      {() => empty ? <p>Sem controles</p> : <>
        <label htmlFor="focus-title">Título</label><input id="focus-title" />
        <label htmlFor="focus-notes">Notas</label><textarea id="focus-notes" />
        <button>Salvar</button>
      </>}
    </GoalGlassDialog>}
  </>;
}

beforeEach(() => {
  const original = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: true }));
});
afterEach(() => vi.restoreAllMocks());

describe("Foco de GoalGlassDialog", () => {
  it("move o foco para o primeiro campo e mantém Tab e Shift+Tab no formulário", async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.click(screen.getByRole("button", { name: "Abrir formulário" }));
    expect(screen.getByLabelText("Título")).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Salvar" })).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Título")).toHaveFocus();
    await user.tab();
    expect(screen.getByLabelText("Notas")).toHaveFocus();
  });

  it("impede que outro controle receba foco enquanto o modal está aberto", async () => {
    render(<Host />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir formulário" }));
    screen.getByRole("button", { name: "Fundo" }).focus();
    expect(screen.getByLabelText("Título")).toHaveFocus();
  });

  it("devolve o foco ao acionador ao fechar por Escape", async () => {
    render(<Host />);
    const trigger = screen.getByRole("button", { name: "Abrir formulário" });
    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("permite foco no próprio modal quando ele não possui controles", async () => {
    render(<Host empty />);
    await userEvent.click(screen.getByRole("button", { name: "Abrir formulário" }));
    expect(screen.getByRole("dialog")).toHaveFocus();
  });
});
