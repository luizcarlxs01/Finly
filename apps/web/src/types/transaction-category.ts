export const DEFAULT_TRANSACTION_CATEGORY = "geral";

export const TRANSACTION_CATEGORIES = [
  "alimentacao",
  "transporte",
  "moradia",
  "saude",
  "educacao",
  "lazer",
  "salario",
  "freelance",
  "contas",
  "investimentos",
  "compras",
  "geral",
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  alimentacao: "Alimentação",
  transporte: "Transporte",
  moradia: "Moradia",
  saude: "Saúde",
  educacao: "Educação",
  lazer: "Lazer",
  salario: "Salário",
  freelance: "Freelance",
  contas: "Contas",
  investimentos: "Investimentos",
  compras: "Compras",
  geral: "Geral",
};

export function getTransactionCategoryLabel(category: string) {
  return (
    TRANSACTION_CATEGORY_LABELS[
      category as keyof typeof TRANSACTION_CATEGORY_LABELS
    ] ?? TRANSACTION_CATEGORY_LABELS.geral
  );
}
