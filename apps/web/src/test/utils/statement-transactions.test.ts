import { describe, expect, it } from "vitest";
import type { Transaction } from "@/types/transaction";
import { sortStatementTransactions } from "@/utils/statement-transactions";
const item = (id: string, type: Transaction["type"], amount: number, occurrenceDate: string, createdAt = "2026-10-01T12:00:00Z") => ({ id, type, amount, occurrenceDate, createdAt, title: id }) as Transaction;
describe("ordenação do extrato", () => {
  it("ordena o valor com sinal em ambos os sentidos sem alterar os dados", () => {
    const rows = [item("expense-large", "expense", 100, "2026-10-01"), item("income-small", "income", 10, "2026-10-01"), item("expense-small", "expense", 20, "2026-10-01"), item("income-large", "income", 200, "2026-10-01")];
    const original = [...rows];
    expect(sortStatementTransactions(rows, "highest").map(row => row.id)).toEqual(["income-large", "income-small", "expense-small", "expense-large"]);
    expect(sortStatementTransactions(rows, "lowest").map(row => row.id)).toEqual(["expense-large", "expense-small", "income-small", "income-large"]);
    expect(rows).toEqual(original);
  });
  it("usa a data do lançamento, mantendo desempates estáveis após filtros", () => {
    const rows = [item("b", "income", 10, "2026-10-10"), item("a", "income", 10, "2026-10-10"), item("older", "income", 10, "2026-10-02", "2026-10-14T12:00:00Z")];
    expect(sortStatementTransactions(rows, "newest").map(row => row.id)).toEqual(["a", "b", "older"]);
    expect(sortStatementTransactions(rows, "oldest").map(row => row.id)).toEqual(["older", "a", "b"]);
    expect(sortStatementTransactions(rows.filter(row => row.id !== "older"), "highest").map(row => row.id)).toEqual(["a", "b"]);
  });
});
