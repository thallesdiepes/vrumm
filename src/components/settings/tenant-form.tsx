"use client";

import { useState, useTransition } from "react";
import { updateTenant } from "@/app/actions/tenant";
import { Check } from "lucide-react";

type Tenant = {
  name: string;
  cnpj: string | null;
  address: string | null;
  whatsapp_number: string | null;
};

const inputCls =
  "w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-3 py-2.5 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors";

export function TenantForm({ tenant }: { tenant: Tenant }) {
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name:             tenant.name,
    cnpj:             tenant.cnpj ?? "",
    address:          tenant.address ?? "",
    whatsapp_number:  tenant.whatsapp_number ?? "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Nome da estética é obrigatório."); return; }
    setError("");
    setSaved(false);
    startTransition(async () => {
      try {
        await updateTenant(form);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  const fields: { key: keyof typeof form; label: string; placeholder: string; hint?: string }[] = [
    { key: "name",            label: "Nome da estética *", placeholder: "Auto Brilho Detalhamento",  hint: "Aparece no cabeçalho dos orçamentos." },
    { key: "cnpj",            label: "CNPJ",               placeholder: "00.000.000/0001-00" },
    { key: "address",         label: "Endereço",           placeholder: "Rua das Flores, 123 — São Paulo, SP" },
    { key: "whatsapp_number", label: "Telefone / WhatsApp", placeholder: "(11) 99999-9999" },
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
      {fields.map(({ key, label, placeholder, hint }) => (
        <div key={key}>
          <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">
            {label}
          </label>
          <input
            type="text"
            value={form[key]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            placeholder={placeholder}
            className={inputCls}
          />
          {hint && <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">{hint}</p>}
        </div>
      ))}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm">
            <Check className="w-4 h-4" /> Salvo com sucesso
          </span>
        )}
      </div>
    </form>
  );
}
