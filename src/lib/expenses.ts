import { daysInMonth, monthKey, type Month } from "./dashboard/months";

// Sugestões da tela — a categoria é texto livre, o usuário pode digitar outra.
export const EXPENSE_CATEGORIES = [
  "Produtos e insumos",
  "Aluguel",
  "Salários e comissões",
  "Contas (água, luz, internet)",
  "Equipamentos",
  "Marketing",
  "Impostos",
  "Outros",
] as const;

export type ExpenseRow = {
  id: string;
  description: string;
  amount: number | string;
  expense_date: string; // YYYY-MM-DD
  category: string;
  is_fixed: boolean;
};

export type NewExpense = Omit<ExpenseRow, "id">;

/**
 * Cópias dos custos fixos do mês anterior para o mês alvo.
 * Mantém o dia (limitado ao fim do mês: 31/jan → 28/fev).
 * Pula o que já existe no mês alvo com mesma descrição + categoria
 * (fixo, sem diferenciar maiúsculas) — clicar duas vezes não duplica.
 */
export function planFixedCopies(
  previousMonthFixed: NewExpense[],
  targetMonthExisting: NewExpense[],
  target: Month,
): NewExpense[] {
  const norm = (e: Pick<NewExpense, "description" | "category">) =>
    `${e.description.trim().toLowerCase()}|${e.category.trim().toLowerCase()}`;
  const already = new Set(targetMonthExisting.filter((e) => e.is_fixed).map(norm));
  const lastDay = daysInMonth(target);

  const copies: NewExpense[] = [];
  for (const e of previousMonthFixed) {
    if (!e.is_fixed || already.has(norm(e))) continue;
    already.add(norm(e));
    const day = Math.min(Number(e.expense_date.slice(8, 10)), lastDay);
    copies.push({
      description: e.description,
      amount: e.amount,
      category: e.category,
      is_fixed: true,
      expense_date: `${monthKey(target)}-${String(day).padStart(2, "0")}`,
    });
  }
  return copies;
}
