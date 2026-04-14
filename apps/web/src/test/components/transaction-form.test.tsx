import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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

import { TransactionForm } from "@/components/dashboard/transaction-form";

function renderTransactionForm(
  overrides: Partial<React.ComponentProps<typeof TransactionForm>> = {},
) {
  const props: React.ComponentProps<typeof TransactionForm> = {
    initialBalance: 1000,
    onUpdateInitialBalance: vi.fn(),
    onAddTransaction: vi.fn(),
    onPreviewTransaction: vi.fn(),
    onClearPreview: vi.fn(),
    isPreviewActive: false,
    ...overrides,
  };

  return {
    ...render(<TransactionForm {...props} />),
    props,
  };
}

describe("TransactionForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deve renderizar os campos principais com defaults relevantes do modo unico", () => {
    renderTransactionForm();

    expect(screen.getByLabelText("Saldo atual")).toHaveValue(1000);
    expect(
      screen.getByRole("button", { name: "Salvar saldo inicial" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("T\u00edtulo")).toHaveValue("");
    expect(screen.getByLabelText("Valor")).toHaveValue(null);
    expect(screen.getByLabelText("Entrada ou sa\u00edda")).toHaveValue("expense");
    expect(screen.getByLabelText("Categoria")).toHaveValue("geral");
    expect(screen.getByLabelText("Data")).toHaveValue("2026-04-10");
    expect(
      screen.queryByLabelText("Quantidade de parcelas"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Dia da recorr\u00eancia"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Salvar lan\u00e7amento" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Simular impacto/i }),
    ).toBeInTheDocument();
  });

  it("deve salvar o saldo inicial com o valor informado", async () => {
    const user = userEvent.setup();
    const onUpdateInitialBalance = vi.fn();

    renderTransactionForm({ onUpdateInitialBalance });

    const balanceInput = screen.getByLabelText("Saldo atual");

    await user.clear(balanceInput);
    await user.type(balanceInput, "2450.75");
    await user.click(
      screen.getByRole("button", { name: "Salvar saldo inicial" }),
    );

    expect(onUpdateInitialBalance).toHaveBeenCalledWith(2450.75);
  });

  it("deve enviar um lancamento unico com os dados minimos validos", async () => {
    const user = userEvent.setup();
    const onAddTransaction = vi.fn();
    const onClearPreview = vi.fn();

    renderTransactionForm({ onAddTransaction, onClearPreview });

    await user.type(screen.getByLabelText("T\u00edtulo"), "PIX");
    await user.type(screen.getByLabelText("Valor"), "50");
    await user.click(
      screen.getByRole("button", { name: "Salvar lan\u00e7amento" }),
    );

    expect(onAddTransaction).toHaveBeenCalledWith({
      title: "PIX",
      amount: 50,
      type: "expense",
      category: "geral",
      transactionKind: "single",
      transactionDate: "2026-04-10",
      isRecurring: false,
      recurrenceType: null,
      recurrenceDay: null,
      recurrenceStartDate: null,
    });
    expect(onClearPreview).toHaveBeenCalledTimes(1);
  });

  it("deve preencher e enviar um lancamento unico valido, limpando o formulario apos salvar", async () => {
    const user = userEvent.setup();
    const onAddTransaction = vi.fn();
    const onClearPreview = vi.fn();

    renderTransactionForm({ onAddTransaction, onClearPreview });

    await user.type(screen.getByLabelText("T\u00edtulo"), "  Mercado do m\u00eas  ");
    await user.type(screen.getByLabelText("Valor"), "250.5");
    await user.selectOptions(
      screen.getByLabelText("Entrada ou sa\u00edda"),
      "income",
    );
    await user.selectOptions(screen.getByLabelText("Categoria"), "salario");
    await user.clear(screen.getByLabelText("Data"));
    await user.type(screen.getByLabelText("Data"), "2026-04-15");
    await user.click(
      screen.getByRole("button", { name: "Salvar lan\u00e7amento" }),
    );

    expect(onAddTransaction).toHaveBeenCalledWith({
      title: "Mercado do m\u00eas",
      amount: 250.5,
      type: "income",
      category: "salario",
      transactionKind: "single",
      transactionDate: "2026-04-15",
      isRecurring: false,
      recurrenceType: null,
      recurrenceDay: null,
      recurrenceStartDate: null,
    });
    expect(onClearPreview).toHaveBeenCalledTimes(1);

    expect(screen.getByLabelText("T\u00edtulo")).toHaveValue("");
    expect(screen.getByLabelText("Valor")).toHaveValue(null);
    expect(screen.getByLabelText("Entrada ou sa\u00edda")).toHaveValue("expense");
    expect(screen.getByLabelText("Categoria")).toHaveValue("geral");
    expect(screen.getByLabelText("Data")).toHaveValue("2026-04-10");
  });

  it("deve exibir campos de parcelamento e simular impacto com os dados corretos", async () => {
    const user = userEvent.setup();
    const onPreviewTransaction = vi.fn();

    renderTransactionForm({ onPreviewTransaction });

    await user.click(screen.getByRole("button", { name: /Parcelado/i }));

    expect(screen.getByLabelText("Quantidade de parcelas")).toHaveValue(2);
    expect(screen.getByLabelText("Primeira parcela")).toHaveValue("2026-04-10");
    expect(screen.queryByLabelText("Data")).not.toBeInTheDocument();

    await user.type(screen.getByLabelText("T\u00edtulo"), "Notebook");
    await user.type(screen.getByLabelText("Valor"), "3000");
    await user.selectOptions(screen.getByLabelText("Categoria"), "compras");
    await user.clear(screen.getByLabelText("Quantidade de parcelas"));
    await user.type(screen.getByLabelText("Quantidade de parcelas"), "10");
    await user.clear(screen.getByLabelText("Primeira parcela"));
    await user.type(screen.getByLabelText("Primeira parcela"), "2026-05-01");
    await user.click(screen.getByRole("button", { name: /Simular impacto/i }));

    expect(onPreviewTransaction).toHaveBeenCalledWith({
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
      installmentStartDate: "2026-05-01",
    });
  });

  it("deve alternar campos condicionais da recorrencia e bloquear submit invalido", async () => {
    const user = userEvent.setup();
    const onAddTransaction = vi.fn();

    renderTransactionForm({ onAddTransaction });

    await user.click(screen.getByRole("button", { name: /Recorrente/i }));

    expect(screen.getByLabelText("Dia da recorr\u00eancia")).toHaveValue(10);
    expect(screen.getByLabelText("Data de in\u00edcio")).toHaveValue("2026-04-10");
    expect(screen.getByLabelText("At\u00e9 quando repetir")).toHaveValue("indefinite");

    await user.selectOptions(
      screen.getByLabelText("At\u00e9 quando repetir"),
      "until-date",
    );
    expect(screen.getByLabelText("Data final")).toHaveValue("2026-04-10");

    await user.type(screen.getByLabelText("T\u00edtulo"), "Assinatura");
    await user.type(screen.getByLabelText("Valor"), "49.9");
    await user.selectOptions(screen.getByLabelText("Categoria"), "lazer");
    await user.clear(screen.getByLabelText("Data de in\u00edcio"));
    await user.type(screen.getByLabelText("Data de in\u00edcio"), "2026-04-20");
    await user.clear(screen.getByLabelText("Data final"));
    await user.type(screen.getByLabelText("Data final"), "2026-04-15");
    await user.click(
      screen.getByRole("button", { name: "Salvar lan\u00e7amento" }),
    );

    expect(onAddTransaction).not.toHaveBeenCalled();

    await user.selectOptions(
      screen.getByLabelText("At\u00e9 quando repetir"),
      "for-months",
    );
    expect(screen.getByLabelText("Quantidade de meses")).toHaveValue(3);
    expect(screen.queryByLabelText("Data final")).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Quantidade de meses"));
    await user.type(screen.getByLabelText("Quantidade de meses"), "6");
    await user.clear(screen.getByLabelText("Dia da recorr\u00eancia"));
    await user.type(screen.getByLabelText("Dia da recorr\u00eancia"), "12");
    await user.click(
      screen.getByRole("button", { name: "Salvar lan\u00e7amento" }),
    );

    expect(onAddTransaction).toHaveBeenCalledWith({
      title: "Assinatura",
      amount: 49.9,
      type: "expense",
      category: "lazer",
      transactionKind: "recurring-template",
      isRecurring: true,
      recurrenceType: "monthly",
      recurrenceMode: "for-months",
      recurrenceDay: 12,
      recurrenceStartDate: "2026-04-20",
      recurrenceEndDate: null,
      recurrenceMonths: 6,
    });
  });

  it("deve mostrar aviso de simulacao ativa e permitir limpa-la", async () => {
    const user = userEvent.setup();
    const onClearPreview = vi.fn();

    renderTransactionForm({
      isPreviewActive: true,
      onClearPreview,
    });

    expect(screen.getByText("Simula\u00e7\u00e3o ativa")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A previs\u00e3o j\u00e1 est\u00e1 mostrando esse impacto sem salvar nada.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Limpar simula\u00e7\u00e3o" }));

    expect(onClearPreview).toHaveBeenCalledTimes(1);
  });
});
