import { Banknote, BriefcaseBusiness, Car, Gamepad2, GraduationCap, HeartPulse, House, ReceiptText, ShoppingBag, Target, TrendingUp, Utensils } from "lucide-react";
import type { TransactionCategory } from "@/types/transaction-category";

const icons = { alimentacao: Utensils, transporte: Car, moradia: House, saude: HeartPulse, educacao: GraduationCap, lazer: Gamepad2, salario: Banknote, freelance: BriefcaseBusiness, contas: ReceiptText, investimentos: TrendingUp, compras: ShoppingBag, geral: Target };

export function getCategoryIcon(category: string) {
  return icons[category as TransactionCategory] ?? Target;
}
