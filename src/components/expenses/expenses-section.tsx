"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Receipt, Copy, Repeat } from "lucide-react";
import { upsertExpense, deleteExpense, copyFixedExpenses } from "@/app/actions/expenses";
import { EXPENSE_CATEGORIES, type ExpenseRow } from "@/lib/expenses";
import { showToast } from "@/components/ui/toast";

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const dayMonth = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`;

const inputCls =
  "w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-3 py-2 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors";
const labelCls = "text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5";

type Form = { description: string; amount: string; expenseDate: string; category: string; isFixed: boolean };

export function ExpensesSection({
  expenses,
  monthParam,
  defaultDate,
  prevFixedCount,
}: {
  expenses: ExpenseRow[];
  monthParam: string;
  defaultDate: string;
  prevFixedCount: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [modal, setModal] = useState<{ editing?: ExpenseRow } | null>(null);
  const [form, setForm] = useState<Form>({ description: "", amount: "", expenseDate: defaultDate, category: "", isFixed: false });
  const [error, setError] = useState("");

  const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const byCategory = [...expenses.reduce((m, e) => m.set(e.category, (m.get(e.category) ?? 0) + Number(e.amount)), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  const fixedTotal = expenses.filter((e) => e.is_fixed).reduce((s, e) => s + Number(e.amount), 0);

  function openCreate() {
    setForm({ description: "", amount: "", expenseDate: defaultDate, category: "", isFixed: false });
    setError("");
    setModal({});
  }

  function openEdit(e: ExpenseRow) {
    setForm({
      description: e.description,
      amount: String(Number(e.amount)),
      expenseDate: e.expense_date,
      category: e.category,
      isFixed: e.is_fixed,
    });
    setError("");
    setModal({ editing: e });
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const amount = parseFloat(form.amount.replace(",", "."));
    if (!form.description.trim()) { setError("Descrição é obrigatória."); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setError("Informe um valor maior que zero."); return; }
    if (!form.expenseDate) { setError("Informe a data."); return; }
    setError("");
    startTransition(async () => {
      try {
        await upsertExpense({
          id: modal?.editing?.id,
          description: form.description,
          amount,
          expenseDate: form.expenseDate,
          category: form.category,
          isFixed: form.isFixed,
        });
        setModal(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  function handleDelete(e: ExpenseRow) {
    if (!confirm(`Excluir "${e.description}"?`)) return;
    startTransition(async () => {
      try { await deleteExpense(e.id); }
      catch { showToast("Não foi possível excluir o custo. Tente novamente."); }
    });
  }

  function handleCopyFixed() {
    startTransition(async () => {
      try {
        const n = await copyFixedExpenses(monthParam);
        showToast(
          n === 0 ? "Os custos fixos do mês anterior já estão neste mês." : `${n} custo${n !== 1 ? "s" : ""} fixo${n !== 1 ? "s" : ""} copiado${n !== 1 ? "s" : ""}.`,
          "success",
        );
      } catch {
        showToast("Não foi possível copiar os custos fixos. Tente novamente.");
      }
    });
  }

  return (
    <div>
      {/* Ações */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mb-6">
        {prevFixedCount > 0 && (
          <button
            onClick={handleCopyFixed}
            disabled={isPending}
            className="flex items-center justify-center gap-2 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            <Copy className="w-4 h-4" />
            Copiar fixos do mês anterior ({prevFixedCount})
          </button>
        )}
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo custo
        </button>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-zinc-500">
          <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum custo lançado neste mês.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Resumo */}
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm h-fit">
            <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wider mb-2">Total do mês</p>
            <p className="font-display font-black text-3xl leading-none text-gray-900 dark:text-zinc-100 tabular-nums">{brl(total)}</p>
            {fixedTotal > 0 && (
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">{brl(fixedTotal)} em custos fixos</p>
            )}
            <ul className="mt-5 space-y-2.5 border-t border-gray-100 dark:border-zinc-800 pt-4">
              {byCategory.map(([cat, value]) => (
                <li key={cat} className="flex items-baseline gap-2 text-sm">
                  <span className="flex-1 min-w-0 truncate text-gray-600 dark:text-zinc-400">{cat}</span>
                  <span className="text-xs text-gray-400 dark:text-zinc-500 tabular-nums">{Math.round((value / total) * 100)}%</span>
                  <span className="font-medium text-gray-900 dark:text-zinc-100 tabular-nums">{brl(value)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lista */}
          <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-zinc-800 h-fit">
            {expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <span className="hidden sm:block text-xs text-gray-400 dark:text-zinc-500 tabular-nums w-10 shrink-0">{dayMonth(e.expense_date)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate flex items-center gap-1.5">
                    {e.description}
                    {e.is_fixed && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded px-1.5 py-0.5 shrink-0">
                        <Repeat className="w-2.5 h-2.5" /> Fixo
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">
                    <span className="sm:hidden tabular-nums">{dayMonth(e.expense_date)} · </span>
                    {e.category}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-zinc-100 tabular-nums shrink-0">{brl(Number(e.amount))}</span>
                <div className="flex flex-col sm:flex-row items-center gap-0.5 sm:gap-1 shrink-0">
                  <button onClick={() => openEdit(e)} title="Editar" className="text-gray-400 dark:text-zinc-500 hover:text-amber-500 p-1 transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(e)} disabled={isPending} title="Excluir" className="text-gray-400 dark:text-zinc-500 hover:text-red-500 p-1 transition-colors disabled:opacity-40">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100">{modal.editing ? "Editar custo" : "Novo custo"}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 pb-8 sm:pb-6 space-y-4">
              <div>
                <label className={labelCls}>Descrição *</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Ex: Cera de carnaúba 5L"
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Valor (R$) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0,00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Data *</label>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Categoria</label>
                <input
                  type="text"
                  list="expense-categories"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Escolha ou digite uma categoria"
                  className={inputCls}
                />
                <datalist id="expense-categories">
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} />)}
                </datalist>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">Em branco vira &quot;Outros&quot;.</p>
              </div>
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isFixed}
                  onChange={(e) => setForm({ ...form, isFixed: e.target.checked })}
                  className="mt-0.5 w-4 h-4 accent-amber-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900 dark:text-zinc-100">Custo fixo</span>
                  <span className="block text-xs text-gray-400 dark:text-zinc-500">
                    Aluguel, salários, contas… Aparece no &quot;Copiar fixos do mês anterior&quot; no mês seguinte.
                  </span>
                </span>
              </label>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60">
                  {isPending ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
