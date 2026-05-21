"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Plus, Pencil, Trash2, Upload, X, Check } from "lucide-react";
import {
  masterUpdateTenant,
  masterCreateService,
  masterUpdateService,
  masterDeleteService,
  masterImportServices,
} from "@/app/actions/master";
import { showToast } from "@/components/ui/toast";

type Tenant = {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  whatsapp_number: string | null;
  logo_url: string | null;
};

type Service = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  duration_estimated: string | null;
};

type Tab = "info" | "servicos" | "csv";

const CSV_EXAMPLE = `titulo,descricao,preco,duracao_estimada
Lavagem completa,Lavagem externa e interna,80.00,1h
Vitrificação,Proteção cerâmica,1500.00,8h
Polimento,Polimento técnico 3 etapas,350.00,4h`;

export function MasterTenantClient({
  tenant: initialTenant,
  services: initialServices,
}: {
  tenant: Tenant;
  services: Service[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("info");
  const [isPending, startTransition] = useTransition();

  // ── Info state ──
  const [info, setInfo] = useState({
    name: initialTenant.name,
    cnpj: initialTenant.cnpj ?? "",
    address: initialTenant.address ?? "",
    whatsapp_number: initialTenant.whatsapp_number ?? "",
    logo_url: initialTenant.logo_url ?? "",
  });

  function handleSaveInfo() {
    startTransition(async () => {
      try {
        await masterUpdateTenant(initialTenant.id, {
          name: info.name,
          cnpj: info.cnpj || null,
          address: info.address || null,
          whatsapp_number: info.whatsapp_number || null,
          logo_url: info.logo_url || null,
        });
        showToast("Informações salvas!");
        router.refresh();
      } catch {
        showToast("Erro ao salvar informações.");
      }
    });
  }

  // ── Services state ──
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Service>>({});
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState({ title: "", description: "", price: "", duration_estimated: "" });

  function startEdit(s: Service) {
    setEditingId(s.id);
    setEditForm({ ...s });
  }

  function handleSaveEdit() {
    if (!editingId || !editForm.title) return;
    startTransition(async () => {
      try {
        await masterUpdateService(editingId, initialTenant.id, {
          title: editForm.title!,
          description: editForm.description || null,
          price: Number(editForm.price) || 0,
          duration_estimated: editForm.duration_estimated || null,
        });
        setServices((prev) => prev.map((s) => s.id === editingId ? { ...s, ...editForm, price: Number(editForm.price) || 0 } : s));
        setEditingId(null);
        showToast("Serviço atualizado!");
      } catch {
        showToast("Erro ao atualizar serviço.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este serviço?")) return;
    startTransition(async () => {
      try {
        await masterDeleteService(id, initialTenant.id);
        setServices((prev) => prev.filter((s) => s.id !== id));
        showToast("Serviço excluído.");
      } catch {
        showToast("Erro ao excluir serviço.");
      }
    });
  }

  function handleCreateService() {
    if (!newForm.title) return;
    startTransition(async () => {
      try {
        await masterCreateService(initialTenant.id, {
          title: newForm.title,
          description: newForm.description || null,
          price: Number(newForm.price) || 0,
          duration_estimated: newForm.duration_estimated || null,
        });
        setNewForm({ title: "", description: "", price: "", duration_estimated: "" });
        setShowNewForm(false);
        showToast("Serviço criado!");
        router.refresh();
      } catch {
        showToast("Erro ao criar serviço.");
      }
    });
  }

  // ── CSV state ──
  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState<string | null>(null);

  function handleImport() {
    if (!csvText.trim()) return;
    startTransition(async () => {
      try {
        const count = await masterImportServices(initialTenant.id, csvText);
        setCsvResult(`${count} serviço(s) importado(s) com sucesso!`);
        setCsvText("");
        showToast(`${count} serviços importados!`);
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao importar.";
        setCsvResult(`Erro: ${msg}`);
        showToast("Erro ao importar CSV.");
      }
    });
  }

  const inputClass = "w-full bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:border-amber-400 dark:focus:border-amber-400 transition-colors";

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 dark:bg-zinc-800 p-1 rounded-lg w-fit">
        {(["info", "servicos", "csv"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 shadow-sm"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
            }`}
          >
            {t === "info" ? "Informações" : t === "servicos" ? "Serviços" : "Import CSV"}
          </button>
        ))}
      </div>

      {/* ── Tab: Informações ── */}
      {tab === "info" && (
        <div className="space-y-4 max-w-lg">
          {info.logo_url && (
            <div className="mb-2">
              <img src={info.logo_url} alt="Logo" className="h-16 object-contain rounded-lg border border-gray-200 dark:border-zinc-700 p-2 bg-white dark:bg-zinc-800" />
            </div>
          )}
          {[
            { key: "name", label: "Nome da estética", placeholder: "Ex: Auto Estética Silva" },
            { key: "logo_url", label: "URL da logo", placeholder: "https://..." },
            { key: "cnpj", label: "CNPJ", placeholder: "00.000.000/0001-00" },
            { key: "address", label: "Endereço", placeholder: "Rua, número, bairro, cidade" },
            { key: "whatsapp_number", label: "WhatsApp", placeholder: "5521999999999" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                {label}
              </label>
              <input
                className={inputClass}
                placeholder={placeholder}
                value={info[key as keyof typeof info]}
                onChange={(e) => setInfo({ ...info, [key]: e.target.value })}
              />
            </div>
          ))}
          <button
            onClick={handleSaveInfo}
            disabled={isPending}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Salvar informações
          </button>
        </div>
      )}

      {/* ── Tab: Serviços ── */}
      {tab === "servicos" && (
        <div>
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowNewForm(true)}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              <Plus className="w-4 h-4" />
              Novo serviço
            </button>
          </div>

          {showNewForm && (
            <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-4 mb-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700 dark:text-zinc-200">Novo serviço</p>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} placeholder="Título *" value={newForm.title} onChange={(e) => setNewForm({ ...newForm, title: e.target.value })} />
                <input className={inputClass} placeholder="Duração (ex: 2h)" value={newForm.duration_estimated} onChange={(e) => setNewForm({ ...newForm, duration_estimated: e.target.value })} />
                <input className={inputClass} placeholder="Descrição" value={newForm.description} onChange={(e) => setNewForm({ ...newForm, description: e.target.value })} />
                <input className={inputClass} placeholder="Preço (ex: 150.00)" type="number" value={newForm.price} onChange={(e) => setNewForm({ ...newForm, price: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateService} disabled={isPending || !newForm.title} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
                  <Check className="w-3.5 h-3.5" /> Salvar
                </button>
                <button onClick={() => setShowNewForm(false)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 text-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                  <X className="w-3.5 h-3.5" /> Cancelar
                </button>
              </div>
            </div>
          )}

          {services.length === 0 && !showNewForm && (
            <p className="text-gray-400 dark:text-zinc-500 text-sm text-center py-10">Nenhum serviço cadastrado.</p>
          )}

          <div className="space-y-2">
            {services.map((s) => (
              <div key={s.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
                {editingId === s.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input className={inputClass} placeholder="Título *" value={editForm.title ?? ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                      <input className={inputClass} placeholder="Duração" value={editForm.duration_estimated ?? ""} onChange={(e) => setEditForm({ ...editForm, duration_estimated: e.target.value })} />
                      <input className={inputClass} placeholder="Descrição" value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
                      <input className={inputClass} placeholder="Preço" type="number" value={editForm.price ?? ""} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} disabled={isPending} className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">
                        <Check className="w-3.5 h-3.5" /> Salvar
                      </button>
                      <button onClick={() => setEditingId(null)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-500 text-xs hover:bg-gray-50 dark:hover:bg-zinc-800">
                        <X className="w-3.5 h-3.5" /> Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-gray-900 dark:text-zinc-100 font-medium text-sm">{s.title}</p>
                      {s.description && <p className="text-gray-400 dark:text-zinc-500 text-xs mt-0.5">{s.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-green-600 dark:text-green-400 font-semibold text-sm">R$ {Number(s.price).toFixed(2)}</span>
                        {s.duration_estimated && <span className="text-gray-400 dark:text-zinc-500 text-xs">{s.duration_estimated}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(s)} className="text-gray-400 hover:text-amber-500 p-1.5 rounded-lg transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(s.id)} disabled={isPending} className="text-gray-400 hover:text-red-500 p-1.5 rounded-lg transition-colors disabled:opacity-40">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab: Import CSV ── */}
      {tab === "csv" && (
        <div className="max-w-2xl space-y-5">
          <div className="bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-xl p-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-2">Formato esperado</p>
            <pre className="text-xs text-gray-600 dark:text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">{CSV_EXAMPLE}</pre>
            <p className="text-xs text-gray-400 dark:text-zinc-500 mt-3">
              Colunas: <code className="bg-gray-200 dark:bg-zinc-700 px-1 rounded">titulo</code> (obrigatório), <code className="bg-gray-200 dark:bg-zinc-700 px-1 rounded">descricao</code>, <code className="bg-gray-200 dark:bg-zinc-700 px-1 rounded">preco</code>, <code className="bg-gray-200 dark:bg-zinc-700 px-1 rounded">duracao_estimada</code>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
              Cole o conteúdo do CSV aqui
            </label>
            <textarea
              className={`${inputClass} min-h-[200px] font-mono resize-y`}
              placeholder={CSV_EXAMPLE}
              value={csvText}
              onChange={(e) => { setCsvText(e.target.value); setCsvResult(null); }}
            />
          </div>

          {csvResult && (
            <p className={`text-sm font-medium ${csvResult.startsWith("Erro") ? "text-red-500" : "text-green-600 dark:text-green-400"}`}>
              {csvResult}
            </p>
          )}

          <button
            onClick={handleImport}
            disabled={isPending || !csvText.trim()}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {isPending ? "Importando..." : "Importar serviços"}
          </button>
        </div>
      )}
    </div>
  );
}
