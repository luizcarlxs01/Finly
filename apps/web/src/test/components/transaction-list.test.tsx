import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { TransactionList } from "@/components/dashboard/transaction-list";
import type { Transaction } from "@/types/finance";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateOnlyFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

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

function renderTransactionList(
  overrides: Partial<React.ComponentProps<typeof TransactionList>> = {},
) {
  const props: React.ComponentProps<typeof TransactionList> = {
    transactions: [createTransaction()],
    onEditTransaction: vi.fn(),
    onRemoveTransaction: vi.fn(),
    getNextRecurringOccurrence: vi.fn(() => null),
    ...overrides,
  };

  return {
    ...render(<TransactionList {...props} />),
    props,
  };
}

function getTransactionCard(title: string) {
  return screen.getByText(title).closest('[data-slot="card"]');
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

describe("TransactionList", () => {
  it("deve renderizar o estado vazio com os textos padrao ou customizados", () => {
    const { rerender } = render(
      <TransactionList
        transactions={[]}
        onEditTransaction={vi.fn()}
        onRemoveTransaction={vi.fn()}
        getNextRecurringOccurrence={vi.fn()}
      />,
    );

    expect(screen.getByText("Nenhuma transação cadastrada")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Assim que você registrar movimentações, elas aparecerão organizadas aqui.",
      ),
    ).toBeInTheDocument();

    rerender(
      <TransactionList
        transactions={[]}
        onEditTransaction={vi.fn()}
        onRemoveTransaction={vi.fn()}
        getNextRecurringOccurrence={vi.fn()}
        emptyStateTitle="Nenhum resultado"
        emptyStateDescription="Ajuste os filtros para tentar novamente."
      />,
    );

    expect(screen.getByText("Nenhum resultado")).toBeInTheDocument();
    expect(
      screen.getByText("Ajuste os filtros para tentar novamente."),
    ).toBeInTheDocument();
  });

  it("deve renderizar uma ou mais transações com as informacoes principais", () => {
    renderTransactionList({
      transactions: [
        createTransaction(),
        createTransaction({
          id: "tx-2",
          title: "Salario",
          amount: 3500,
          type: "income",
          category: "salario",
          createdAt: "2026-04-03T09:30:00.000Z",
        }),
      ],
    });

    expect(screen.getByText("Mercado")).toBeInTheDocument();
    expect(screen.getByText("Salario")).toBeInTheDocument();
    expect(screen.getByText("Saída")).toBeInTheDocument();
    expect(screen.getByText("Entrada")).toBeInTheDocument();
    expect(screen.getByText("Alimentação")).toBeInTheDocument();
    expect(screen.getByText("Salário")).toBeInTheDocument();
    expect(screen.getAllByText("Único")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Editar" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Remover" })).toHaveLength(2);
  });

  it("deve distinguir visualmente ou textualmente receita e despesa e manter renderizacao consistente com dados minimos validos", () => {
    renderTransactionList({
      transactions: [
        createTransaction({
          id: "tx-minimal",
          title: "PIX",
          amount: 1,
          type: "expense",
          category: "geral",
        }),
        createTransaction({
          id: "tx-income",
          title: "Freela",
          amount: 100,
          type: "income",
          category: "freelance",
        }),
      ],
    });

    const expenseScope = within(getTransactionCard("PIX")!);
    const incomeScope = within(getTransactionCard("Freela")!);

    expect(
      getAllByExactText(expenseScope, currencyFormatter.format(1)).length,
    ).toBeGreaterThan(0);
    expect(getByExactText(expenseScope, "Saída")).toBeInTheDocument();
    expect(getByExactText(expenseScope, "Geral")).toBeInTheDocument();

    expect(
      getAllByExactText(incomeScope, currencyFormatter.format(100)).length,
    ).toBeGreaterThan(0);
    expect(getByExactText(incomeScope, "Entrada")).toBeInTheDocument();
    expect(getByExactText(incomeScope, "Freelance")).toBeInTheDocument();
  });

  it("deve exibir informacoes especificas de recorrencia quando fizerem parte da interface atual", () => {
    const getNextRecurringOccurrence = vi
      .fn<(transaction: Transaction) => string | null>()
      .mockImplementation((transaction) => {
        if (transaction.id === "recurring-template") {
          return "2026-05-10";
        }

        if (transaction.id === "recurring-instance") {
          return "2026-06-10";
        }

        return null;
      });

    renderTransactionList({
      transactions: [
        createTransaction({
          id: "recurring-template",
          title: "Assinatura",
          transactionKind: "recurring-template",
          isRecurring: true,
          recurrenceType: "monthly",
          recurrenceDay: 10,
          recurrenceStartDate: "2026-04-10",
        }),
        createTransaction({
          id: "recurring-instance",
          title: "Aluguel gerado",
          transactionKind: "recurring-instance",
          recurringOccurrenceDate: "2026-05-10",
        }),
      ],
      getNextRecurringOccurrence,
    });

    const templateScope = within(getTransactionCard("Assinatura")!);
    const instanceScope = within(getTransactionCard("Aluguel gerado")!);

    expect(templateScope.getAllByText("Recorrente").length).toBeGreaterThan(0);
    expect(templateScope.getByText("Modelo recorrente")).toBeInTheDocument();
    expect(templateScope.getByText("Mensal · dia 10")).toBeInTheDocument();
    expect(
      templateScope.getByText("Próxima ocorrência:", { exact: false }),
    ).toBeInTheDocument();
    expect(templateScope.getByText("10/05/2026")).toBeInTheDocument();

    expect(instanceScope.getAllByText("Recorrente").length).toBeGreaterThan(0);
    expect(instanceScope.getByText("Lançamento gerado")).toBeInTheDocument();
    expect(
      instanceScope.getByText("Competência gerada:", { exact: false }),
    ).toBeInTheDocument();
    expect(instanceScope.getByText("10/05/2026")).toBeInTheDocument();
    expect(
      instanceScope.getByText("Próximo lançamento:", { exact: false }),
    ).toBeInTheDocument();
    expect(instanceScope.getByText("10/06/2026")).toBeInTheDocument();
  });

  it("deve disparar os callbacks de editar e remover com os dados corretos", async () => {
    const user = userEvent.setup();
    const transaction = createTransaction({
      id: "tx-action",
      title: "Internet",
      createdAt: "2026-04-03T09:30:00.000Z",
    });
    const onEditTransaction = vi.fn();
    const onRemoveTransaction = vi.fn();

    renderTransactionList({
      transactions: [transaction],
      onEditTransaction,
      onRemoveTransaction,
    });

    const scope = within(getTransactionCard("Internet")!);

    expect(
      scope.getByText(dateFormatter.format(new Date("2026-04-03T09:30:00.000Z"))),
    ).toBeInTheDocument();

    await user.click(scope.getByRole("button", { name: "Editar" }));
    await user.click(scope.getByRole("button", { name: "Remover" }));

    expect(onEditTransaction).toHaveBeenCalledWith(transaction);
    expect(onRemoveTransaction).toHaveBeenCalledWith("tx-action");
  });

  it("deve mostrar data sem horario registrado quando createdAt usar o meio-dia sintetico", () => {
    renderTransactionList({
      transactions: [
        createTransaction({
          title: "Compra unica",
          createdAt: "2026-04-01T15:00:00.000Z",
        }),
      ],
    });

    const scope = within(getTransactionCard("Compra unica")!);

    expect(
      scope.getByText(
        `${dateOnlyFormatter.format(new Date("2026-04-01T15:00:00.000Z"))} · sem horário registrado`,
      ),
    ).toBeInTheDocument();
  });
});
