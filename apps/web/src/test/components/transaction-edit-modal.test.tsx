import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/utils/recurring-transactions", async () => {
  const actual = await vi.importActual<typeof import("@/utils/recurring-transactions")>(
    "@/utils/recurring-transactions",
  );

  return {
    ...actual,
    getTodayDateValue: () => "2026-04-10",
    getTodayRecurrenceDay: () => "10",
  };
});

import { TransactionEditModal } from "@/components/dashboard/transaction-edit-modal";
import type { Transaction } from "@/types/finance";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  const original = window.matchMedia;
  vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...original(query), matches: true }));
});
afterEach(() => vi.restoreAllMocks());

function createTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: "tx-1",
    title: "Mercado",
    amount: 250,
    type: "expense",
    category: "alimentacao",
    transactionKind: "single",
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
    createdAt: "2026-04-01T12:00:00.000Z",
    ...overrides,
  };
}

function renderTransactionEditModal(
  overrides: Partial<React.ComponentProps<typeof TransactionEditModal>> = {},
) {
  const props: React.ComponentProps<typeof TransactionEditModal> = {
    transaction: createTransaction(),
    open: true,
    onOpenChange: vi.fn(),
    onSave: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<TransactionEditModal {...props} />),
    props,
  };
}

describe("TransactionEditModal", () => {
  it("fecha pelo fundo sem salvar o rascunho", async () => {
    const { props } = renderTransactionEditModal();
    await userEvent.clear(screen.getByLabelText("Titulo"));
    await userEvent.type(screen.getByLabelText("Titulo"), "Rascunho");
    fireEvent.click(screen.getByRole("dialog"), { clientX: -1, clientY: -1 });
    expect(props.onOpenChange).toHaveBeenCalledWith(false);
    expect(props.onSave).not.toHaveBeenCalled();
  });

  it("preserva salvar ocorrência, marcar paga e solicitar a exclusão da série", async () => {
    const saveOccurrence = vi.fn(), markPaid = vi.fn(), deleteSeries = vi.fn();
    renderTransactionEditModal({ transaction: createTransaction({ transactionKind: "recurring-instance", occurrenceId: "occ-1", occurrenceDate: "2026-04-10", occurrenceStatus: "pending", sourceId: "series-1" }), onSaveOccurrence: saveOccurrence, onMarkOccurrencePaid: markPaid, onRequestDeleteContract: deleteSeries });
    await userEvent.clear(screen.getByLabelText("Valor desta ocorrência"));
    await userEvent.type(screen.getByLabelText("Valor desta ocorrência"), "300");
    await userEvent.click(screen.getByRole("button", { name: "Salvar esta ocorrência" }));
    expect(saveOccurrence).toHaveBeenCalledWith({ id: "occ-1", dueDate: "2026-04-10", amount: 300 });
    await userEvent.click(screen.getByRole("button", { name: "Marcar como paga" }));
    expect(markPaid).toHaveBeenCalledWith("occ-1");
    await userEvent.click(screen.getByRole("button", { name: "Excluir toda a série" }));
    expect(deleteSeries).toHaveBeenCalledWith("series-1");
  });

  it("deve renderizar o modal aberto e preencher os campos iniciais da transacao", () => {
    renderTransactionEditModal();

    expect(screen.getByRole("heading", { name: "Editar lançamento" })).toBeInTheDocument();
    expect(screen.getByLabelText("Titulo")).toHaveValue("Mercado");
    expect(screen.getByLabelText("Valor")).toHaveValue("250");
    expect(screen.getByLabelText("Tipo")).toHaveValue("expense");
    expect(screen.getByLabelText("Categoria")).toHaveValue("alimentacao");
    expect(screen.getByLabelText("Data")).toHaveValue("2026-04-01");
    expect(screen.getByRole("button", { name: "Fechar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeInTheDocument();
  });

  it("nao deve renderizar conteudo relevante quando estiver fechado", () => {
    renderTransactionEditModal({ open: false });

    expect(screen.queryByText("Atualizar transacao")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Titulo")).not.toBeInTheDocument();
  });

  it("deve editar e salvar uma transacao unica com os dados corretos", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderTransactionEditModal({ onSave, onOpenChange });

    await user.clear(screen.getByLabelText("Titulo"));
    await user.type(screen.getByLabelText("Titulo"), "  Salario principal  ");
    await user.clear(screen.getByLabelText("Valor"));
    await user.type(screen.getByLabelText("Valor"), "3500");
    await user.selectOptions(screen.getByLabelText("Tipo"), "income");
    await user.selectOptions(screen.getByLabelText("Categoria"), "salario");
    await user.clear(screen.getByLabelText("Data"));
    await user.type(screen.getByLabelText("Data"), "2026-04-15");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSave).toHaveBeenCalledWith({
      id: "tx-1",
      title: "Salario principal",
      amount: 3500,
      type: "income",
      category: "salario",
      transactionKind: "single",
      transactionDate: "2026-04-15",
      isRecurring: false,
      recurrenceType: null,
      recurrenceDay: null,
      recurrenceStartDate: null,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("deve fechar ao clicar em cancelar, em fechar e ao pressionar Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    renderTransactionEditModal({ onOpenChange });

    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await user.click(screen.getByRole("button", { name: "Fechar" }));
    fireEvent(screen.getByRole("dialog", { name: "Editar lançamento" }), new Event("cancel", { cancelable: true }));

    expect(onOpenChange).toHaveBeenNthCalledWith(1, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(2, false);
    expect(onOpenChange).toHaveBeenNthCalledWith(3, false);
  });

  it("deve exibir campos condicionais de parcelamento e salvar esse tipo corretamente", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderTransactionEditModal({
      transaction: createTransaction({
        id: "installment-1",
        title: "Notebook",
        amount: 3000,
        category: "compras",
        transactionKind: "installment-template",
        installmentCount: 6,
        installmentStartDate: "2026-05-01",
      }),
      onSave,
      onOpenChange,
    });

    expect(screen.getByLabelText("Quantidade de parcelas")).toHaveValue(6);
    expect(screen.getByLabelText("Data da primeira parcela")).toHaveValue(
      "2026-05-01",
    );
    expect(screen.queryByLabelText("Data")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Quantidade de parcelas"));
    await user.type(screen.getByLabelText("Quantidade de parcelas"), "10");
    await user.clear(screen.getByLabelText("Data da primeira parcela"));
    await user.type(
      screen.getByLabelText("Data da primeira parcela"),
      "2026-06-10",
    );
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSave).toHaveBeenCalledWith({
      id: "installment-1",
      title: "Notebook",
      amount: 3000,
      type: "expense",
      category: "compras",
      transactionKind: "installment-template",
      isRecurring: false,
      recurrenceType: null,
      recurrenceDay: null,
      recurrenceStartDate: null,
      installmentCount: 10,
      installmentStartDate: "2026-06-10",
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("deve alternar os campos de recorrencia, bloquear submit invalido e salvar quando valido", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderTransactionEditModal({
      transaction: createTransaction({
        id: "recurring-1",
        title: "Academia",
        amount: 89.9,
        category: "saude",
        transactionKind: "recurring-template",
        isRecurring: true,
        recurrenceType: "monthly",
        recurrenceMode: "indefinite",
        recurrenceDay: 5,
        recurrenceStartDate: "2026-04-05",
      }),
      onSave,
      onOpenChange,
    });

    expect(screen.getByLabelText("Dia da recorrencia")).toHaveValue(5);
    expect(screen.getByLabelText("Data de inicio")).toHaveValue("2026-04-05");
    expect(screen.getByLabelText("Ate quando repetir")).toHaveValue("indefinite");

    await user.selectOptions(
      screen.getByLabelText("Ate quando repetir"),
      "until-date",
    );

    expect(screen.getByLabelText("Data final")).toHaveValue("2026-04-10");

    await user.clear(screen.getByLabelText("Data de inicio"));
    await user.type(screen.getByLabelText("Data de inicio"), "2026-04-20");
    await user.clear(screen.getByLabelText("Data final"));
    await user.type(screen.getByLabelText("Data final"), "2026-04-15");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSave).not.toHaveBeenCalled();

    await user.selectOptions(
      screen.getByLabelText("Ate quando repetir"),
      "for-months",
    );

    expect(screen.getByLabelText("Quantidade de meses")).toHaveValue(3);
    expect(screen.queryByLabelText("Data final")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Quantidade de meses"));
    await user.type(screen.getByLabelText("Quantidade de meses"), "8");
    await user.clear(screen.getByLabelText("Dia da recorrencia"));
    await user.type(screen.getByLabelText("Dia da recorrencia"), "12");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSave).toHaveBeenCalledWith({
      id: "recurring-1",
      title: "Academia",
      amount: 89.9,
      type: "expense",
      category: "saude",
      transactionKind: "recurring-template",
      isRecurring: true,
      recurrenceType: "monthly",
      recurrenceMode: "for-months",
      recurrenceDay: 12,
      recurrenceStartDate: "2026-04-20",
      recurrenceEndDate: null,
      recurrenceMonths: 8,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("deve limitar a edicao de lancamento gerado automaticamente e preservar o tipo original no save", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    renderTransactionEditModal({
      transaction: createTransaction({
        id: "generated-1",
        title: "Parcela 2/6",
        amount: 500,
        category: "compras",
        transactionKind: "installment-instance",
        sourceId: "installment-template-1",
        installmentIndex: 2,
        installmentCount: 6,
      }),
      onSave,
      onOpenChange,
    });

    expect(
      screen.getByText("Lancamento gerado automaticamente"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Tipo do lancamento")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Data")).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Quantidade de parcelas"),
    ).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Titulo"));
    await user.type(screen.getByLabelText("Titulo"), "Parcela ajustada");
    await user.clear(screen.getByLabelText("Valor"));
    await user.type(screen.getByLabelText("Valor"), "650");
    await user.selectOptions(screen.getByLabelText("Tipo"), "income");
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));

    expect(onSave).toHaveBeenCalledWith({
      id: "generated-1",
      title: "Parcela ajustada",
      amount: 650,
      type: "income",
      category: "compras",
      transactionKind: "installment-instance",
      isRecurring: false,
      recurrenceType: null,
      recurrenceDay: null,
      recurrenceStartDate: null,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
