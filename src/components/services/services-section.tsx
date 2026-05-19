"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, X, Wrench, Clock, DollarSign } from "lucide-react";
import { upsertService, deleteService } from "@/app/actions/services";

type Service = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  duration_estimated: string | null;
};

const empty = { title: "", description: "", price: "", duration_estimated: "" };

const inputCls =
  "w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-3 py-2 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors";

export function ServicesSection({ initialServices }: { initialServices: Service[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null); setForm(empty); setError(""); setModalOpen(true);
  }

  function openEdit(service: Service) {
    setEditing(service);
    setForm({
      title: service.title,
      description: service.description ?? "",
      price: String(service.price),
      duration_estimated: service.duration_estimated ?? "",
    });
    setError(""); setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.title) { setError("Título é obrigatório."); return; }
    if (isNaN(price) || price < 0) { setError("Preço inválido."); return; }
    setError("");
    startTransition(async () => {
      try {
        await upsertService({ id: editing?.id, title: form.title, description: form.description, price, duration_estimated: form.duration_estimated });
        setModalOpen(false);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    startTransition(async () => {
      try { await deleteService(id); }
      catch (err: unknown) { alert(err instanceof Error ? err.message : "Erro ao excluir."); }
    });
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {initialServices.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-zinc-500">
          <Wrench className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum serviço cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {initialServices.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-zinc-100">{service.title}</h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEdit(service)}
                    className="text-gray-400 dark:text-zinc-500 hover:text-amber-500 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    className="text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {service.description && (
                <p className="text-gray-500 dark:text-zinc-400 text-sm leading-relaxed">{service.description}</p>
              )}

              <div className="flex items-center gap-4 mt-auto pt-3 border-t border-gray-100 dark:border-zinc-800">
                <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 font-semibold text-sm">
                  <DollarSign className="w-3.5 h-3.5" />
                  R$ {Number(service.price).toFixed(2)}
                </span>
                {service.duration_estimated && (
                  <span className="flex items-center gap-1.5 text-gray-400 dark:text-zinc-500 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    {service.duration_estimated}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100">
                {editing ? "Editar Serviço" : "Novo Serviço"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Título *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Polimento completo" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Descrição</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descreva o serviço..." rows={3} className={`${inputCls} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Preço (R$) *</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">Duração</label>
                  <input type="text" value={form.duration_estimated} onChange={(e) => setForm({ ...form, duration_estimated: e.target.value })} placeholder="Ex: 2h" className={inputCls} />
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
                >
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
