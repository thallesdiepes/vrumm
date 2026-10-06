import { createClient } from "@/lib/supabase/server";
import { addMonths, compareMonths, currentMonth, monthFirstDate, monthKey, parseMonthParam, todayDate } from "@/lib/dashboard/months";
import { MonthSelector } from "@/components/dashboard/month-selector";
import { ExpensesSection } from "@/components/expenses/expenses-section";
import type { ExpenseRow } from "@/lib/expenses";

export default async function CustosPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>;
}) {
  const { mes } = await searchParams;
  const selected = parseMonthParam(mes);
  const prev = addMonths(selected, -1);
  const supabase = await createClient();

  const [monthRes, prevFixedRes] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, description, amount, expense_date, category, is_fixed")
      .gte("expense_date", monthFirstDate(selected))
      .lt("expense_date", monthFirstDate(addMonths(selected, 1)))
      .order("expense_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("is_fixed", true)
      .gte("expense_date", monthFirstDate(prev))
      .lt("expense_date", monthFirstDate(selected)),
  ]);

  // Data sugerida no "Novo custo": hoje no mês atual, dia 1 em meses passados
  const defaultDate = compareMonths(selected, currentMonth()) === 0 ? todayDate() : monthFirstDate(selected);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Custos</h1>
          <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">
            Gastos da estética — entram no lucro do dashboard.
          </p>
        </div>
        <MonthSelector selected={selected} basePath="/dashboard/custos" />
      </div>

      <ExpensesSection
        expenses={(monthRes.data ?? []) as ExpenseRow[]}
        monthParam={monthKey(selected)}
        defaultDate={defaultDate}
        prevFixedCount={prevFixedRes.count ?? 0}
      />
    </div>
  );
}
