"use client";

import { useState, useTransition } from "react";
import { Search, Plus, Pencil, Trash2, X, Car, ChevronRight } from "lucide-react";
import { upsertClient, deleteClient, upsertVehicle, deleteVehicle } from "@/app/actions/clients";
import { VehicleForm, type VehicleData } from "@/components/vehicles/vehicle-form";
import { showToast } from "@/components/ui/toast";

type Vehicle = {
  id: string;
  plate: string;
  brand: string | null;
  brand_code: string | null;
  model: string | null;
  model_code: string | null;
  year: string | null;
};

type Client = {
  id: string;
  name: string;
  phone: string | null;
  vehicles: Vehicle[];
};

function vehicleDesc(v: Pick<Vehicle, "brand" | "model" | "year">) {
  return [v.brand, v.model, v.year].filter(Boolean).join(" ");
}

const inputCls =
  "w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-3 py-2 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors";

export function ClientsSection({ initialClients }: { initialClients: Client[] }) {
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Client modal
  const [clientModal, setClientModal] = useState<{ mode: "create" | "edit"; client?: Client } | null>(null);
  const [clientForm, setClientForm] = useState({ name: "", phone: "" });
  const [clientError, setClientError] = useState("");

  // Vehicles modal
  const [vehiclesClient, setVehiclesClient] = useState<Client | null>(null);
  const [vehicleFormMode, setVehicleFormMode] = useState<{ mode: "create" | "edit"; vehicle?: Vehicle } | null>(null);
  const [vehicleError, setVehicleError] = useState("");

  const filtered = initialClients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.vehicles.some((v) => v.plate.toLowerCase().includes(search.toLowerCase()))
  );

  // ── Client modal handlers ──
  function openCreateClient() {
    setClientForm({ name: "", phone: "" });
    setClientError("");
    setClientModal({ mode: "create" });
  }

  function openEditClient(c: Client) {
    setClientForm({ name: c.name, phone: c.phone ?? "" });
    setClientError("");
    setClientModal({ mode: "edit", client: c });
  }

  function handleClientSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientForm.name.trim()) { setClientError("Nome é obrigatório."); return; }
    setClientError("");
    startTransition(async () => {
      try {
        await upsertClient({ id: clientModal?.client?.id, name: clientForm.name, phone: clientForm.phone });
        setClientModal(null);
      } catch (err: unknown) {
        setClientError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  function handleDeleteClient(id: string) {
    if (!confirm("Excluir este cliente e todos os seus veículos?")) return;
    startTransition(async () => {
      try { await deleteClient(id); }
      catch { showToast("Não foi possível excluir o cliente. Verifique se não há orçamentos vinculados."); }
    });
  }

  // ── Vehicles modal handlers ──
  function openVehicles(c: Client) {
    setVehiclesClient(c);
    setVehicleFormMode(null);
    setVehicleError("");
  }

  function handleVehicleSave(data: VehicleData) {
    if (!vehiclesClient) return;
    setVehicleError("");
    startTransition(async () => {
      try {
        await upsertVehicle({
          id: vehicleFormMode?.mode === "edit" ? vehicleFormMode.vehicle?.id : undefined,
          clientId: vehiclesClient.id,
          plate: data.plate,
          brand: data.brand,
          brandCode: data.brandCode,
          model: data.model,
          modelCode: data.modelCode,
          year: data.year,
        });
        setVehicleFormMode(null);
      } catch (err: unknown) {
        setVehicleError(err instanceof Error ? err.message : "Erro ao salvar veículo.");
      }
    });
  }

  function handleDeleteVehicle(v: Vehicle) {
    if (!vehiclesClient) return;
    if (vehiclesClient.vehicles.length <= 1) {
      alert("O cliente deve ter pelo menos um veículo. Exclua o cliente se quiser remover todos.");
      return;
    }
    if (!confirm(`Excluir o veículo ${v.plate}?`)) return;
    startTransition(async () => {
      try { await deleteVehicle(v.id); }
      catch { showToast("Não foi possível excluir o veículo. Tente novamente."); }
    });
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9 w-full sm:w-72`}
          />
        </div>
        <button
          onClick={openCreateClient}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Cliente
        </button>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 dark:text-zinc-500">
          <Car className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>{search ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado ainda."}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-gray-50 dark:bg-zinc-900/50 border-b border-gray-200 dark:border-zinc-800">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Nome</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider hidden md:table-cell">Telefone</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Veículos</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider w-24">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/50">
              {filtered.map((c) => (
                <tr key={c.id} className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-zinc-100">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500 dark:text-zinc-400 hidden md:table-cell">{c.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openVehicles(c)}
                      className="flex items-center gap-1.5 text-gray-500 dark:text-zinc-400 hover:text-amber-500 transition-colors group"
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span className="text-xs">
                        {c.vehicles.length === 0
                          ? "Nenhum veículo"
                          : c.vehicles.length === 1
                          ? `${c.vehicles[0].plate}${vehicleDesc(c.vehicles[0]) ? ` · ${vehicleDesc(c.vehicles[0])}` : ""}`
                          : `${c.vehicles.length} veículos`}
                      </span>
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEditClient(c)} className="text-gray-400 dark:text-zinc-500 hover:text-amber-500 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteClient(c.id)} className="text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Client Modal ── */}
      {clientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-sm bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 dark:bg-zinc-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="font-semibold text-gray-900 dark:text-zinc-100">
                {clientModal.mode === "create" ? "Novo Cliente" : "Editar Cliente"}
              </h2>
              <button onClick={() => setClientModal(null)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleClientSubmit} className="p-6 pb-8 sm:pb-6 space-y-4">
              {([
                ["name", "Nome *", "João Silva", "text"],
                ["phone", "Telefone / WhatsApp", "11999999999", "tel"],
              ] as [keyof typeof clientForm, string, string, string][]).map(([field, label, ph, type]) => (
                <div key={field}>
                  <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">{label}</label>
                  <input
                    type={type}
                    placeholder={ph}
                    value={clientForm[field]}
                    onChange={(e) => setClientForm({ ...clientForm, [field]: e.target.value })}
                    className={inputCls}
                  />
                </div>
              ))}
              {clientError && <p className="text-red-500 text-sm">{clientError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setClientModal(null)} className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg transition-colors">
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

      {/* ── Vehicles Modal ── */}
      {vehiclesClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
              <div className="w-10 h-1 bg-gray-300 dark:bg-zinc-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-zinc-100">Veículos</h2>
                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{vehiclesClient.name}</p>
              </div>
              <button onClick={() => setVehiclesClient(null)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-8 sm:pb-6 space-y-4">
              {/* Vehicle list */}
              {vehiclesClient.vehicles.length === 0 && !vehicleFormMode ? (
                <p className="text-gray-400 dark:text-zinc-500 text-sm text-center py-4">
                  Nenhum veículo cadastrado.
                </p>
              ) : (
                <div className="space-y-2">
                  {vehiclesClient.vehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-gray-200 dark:border-zinc-700"
                    >
                      <Car className="w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-mono text-xs px-2 py-0.5 rounded border border-gray-200 dark:border-zinc-700">
                          {v.plate}
                        </span>
                        {vehicleDesc(v) && (
                          <p className="text-gray-500 dark:text-zinc-400 text-xs mt-1 truncate">{vehicleDesc(v)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => { setVehicleFormMode({ mode: "edit", vehicle: v }); setVehicleError(""); }}
                          className="text-gray-400 dark:text-zinc-500 hover:text-amber-500 transition-colors p-1"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(v)}
                          disabled={isPending}
                          className="text-gray-400 dark:text-zinc-500 hover:text-red-500 transition-colors p-1 disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add vehicle button */}
              {!vehicleFormMode && (
                <button
                  onClick={() => { setVehicleFormMode({ mode: "create" }); setVehicleError(""); }}
                  className="flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar veículo
                </button>
              )}

              {/* Vehicle form */}
              {vehicleFormMode && (
                <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                    {vehicleFormMode.mode === "create" ? "Novo veículo" : "Editar veículo"}
                  </p>
                  {vehicleError && <p className="text-red-500 text-sm mb-3">{vehicleError}</p>}
                  <VehicleForm
                    initialPlate={vehicleFormMode.vehicle?.plate ?? ""}
                    initialBrandCode={vehicleFormMode.vehicle?.brand_code ?? ""}
                    initialBrand={vehicleFormMode.vehicle?.brand ?? ""}
                    initialModelCode={vehicleFormMode.vehicle?.model_code ?? ""}
                    initialModel={vehicleFormMode.vehicle?.model ?? ""}
                    initialYear={vehicleFormMode.vehicle?.year ?? ""}
                    onSave={handleVehicleSave}
                    onCancel={() => setVehicleFormMode(null)}
                    saving={isPending}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
