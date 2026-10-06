"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { addMonths, monthFirstDate, parseMonthParam } from "@/lib/dashboard/months";
import { planFixedCopies, type NewExpense } from "@/lib/expenses";

async function getTenantId() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Perfil não encontrado");
  return { supabase, tenantId: profile.tenant_id as string };
}

function revalidate() {
  revalidatePath("/dashboard/custos");
  revalidatePath("/dashboard");
}

export async function upsertExpense(data: {
  id?: string;
  description: string;
  amount: number;
  expenseDate: string;
  category: string;
  isFixed: boolean;
}) {
  const description = data.description.trim();
  const category = data.category.trim() || "Outros";
  if (!description) throw new Error("Descrição é obrigatória.");
  if (!Number.isFinite(data.amount) || data.amount <= 0) throw new Error("Valor deve ser maior que zero.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.expenseDate)) throw new Error("Data inválida.");

  const { supabase, tenantId } = await getTenantId();
  const payload = {
    tenant_id: tenantId,
    description,
    amount: Math.round(data.amount * 100) / 100,
    expense_date: data.expenseDate,
    category,
    is_fixed: data.isFixed,
  };

  const { error } = data.id
    ? await supabase.from("expenses").update(payload).eq("id", data.id)
    : await supabase.from("expenses").insert(payload);
  if (error) throw new Error(error.message);

  revalidate();
}

export async function deleteExpense(id: string) {
  const { supabase } = await getTenantId();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}

/** Copia os custos marcados como fixos do mês anterior para `monthParam` (YYYY-MM). */
export async function copyFixedExpenses(monthParam: string): Promise<number> {
  const { supabase, tenantId } = await getTenantId();
  const target = parseMonthParam(monthParam);
  const prev = addMonths(target, -1);
  const cols = "description, amount, expense_date, category, is_fixed";

  const [prevRes, targetRes] = await Promise.all([
    supabase.from("expenses").select(cols).eq("is_fixed", true)
      .gte("expense_date", monthFirstDate(prev)).lt("expense_date", monthFirstDate(target)),
    supabase.from("expenses").select(cols).eq("is_fixed", true)
      .gte("expense_date", monthFirstDate(target)).lt("expense_date", monthFirstDate(addMonths(target, 1))),
  ]);
  if (prevRes.error) throw new Error(prevRes.error.message);
  if (targetRes.error) throw new Error(targetRes.error.message);

  const copies = planFixedCopies(
    (prevRes.data ?? []) as NewExpense[],
    (targetRes.data ?? []) as NewExpense[],
    target,
  );
  if (copies.length === 0) return 0;

  // Insert em lote é uma única instrução: entra tudo ou nada
  const { error } = await supabase
    .from("expenses")
    .insert(copies.map((c) => ({ ...c, tenant_id: tenantId })));
  if (error) throw new Error(error.message);

  revalidate();
  return copies.length;
}
