"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Check, ChevronLeft, Car, Wrench, ClipboardList, FileText } from "lucide-react";
import { createQuote } from "@/app/actions/quotes";
import { VehicleForm, type VehicleData } from "@/components/vehicles/vehicle-form";

type Vehicle = { id: string; plate: string; brand: string | null; model: string | null; year: string | null };
type Client = { id: string; name: string; phone: string | null; vehicles: Vehicle[] };
type Service = { id: string; title: string; price: number; duration_estimated: string | null };
type SelectedItem = { serviceId: string; title: string; price: number; quantity: number };
type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: "Cliente",     icon: Car },
  { n: 2, label: "Serviços",    icon: Wrench },
  { n: 3, label: "Observações", icon: ClipboardList },
  { n: 4, label: "Revisão",     icon: FileText },
];

const inputCls =
  "w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-3 py-2 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors";

function vehicleDesc(v: Pick<Vehicle, "brand" | "model" | "year">) {
  return [v.brand, v.model, v.year].filter(Boolean).join(" ");
}

export function NewQuoteForm({ clients, services }: { clients: Client[]; services: Service[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState("");

  // Client selection
  const [clientId, setClientId] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [newClientMode, setNewClientMode] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ name: "", phone: "" });

  // Vehicle selection
  const [vehicleId, setVehicleId] = useState("");
  const [pendingVehicle, setPendingVehicle] = useState<VehicleData | null>(null);
  const [showVehicleForm, setShowVehicleForm] = useState(false);

  // Services
  const [items, setItems] = useState<SelectedItem[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [vehicleNotes, setVehicleNotes] = useState("");

  const selectedClient = clients.find((c) => c.id === clientId);
  const clientVehicles = selectedClient?.vehicles ?? [];
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.vehicles.some((v) => v.plate.toLowerCase().includes(clientSearch.toLowerCase()))
  );

  const filteredServices = services.filter((s) =>
    s.title.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  // Derived display info for review
  const selectedVehicle = clientVehicles.find((v) => v.id === vehicleId);

  function selectClient(id: string) {
    setClientId(id);
    setVehicleId("");
    setPendingVehicle(null);
    setShowVehicleForm(false);
    // Auto-select vehicle if client has exactly one
    const c = clients.find((c) => c.id === id);
    if (c?.vehicles.length === 1) setVehicleId(c.vehicles[0].id);
  }

  function toggleService(s: Service) {
    const exists = items.find((i) => i.serviceId === s.id);
    if (exists) setItems(items.filter((i) => i.serviceId !== s.id));
    else setItems([...items, { serviceId: s.id, title: s.title, price: Number(s.price), quantity: 1 }]);
  }

  function setQty(serviceId: string, qty: number) {
    if (qty < 1) return;
    setItems(items.map((i) => (i.serviceId === serviceId ? { ...i, quantity: qty } : i)));
  }

  function validate(): boolean {
    if (step === 1) {
      if (newClientMode) {
        if (!newClientForm.name.trim()) { setError("Nome do cliente é obrigatório."); return false; }
        if (!pendingVehicle || !pendingVehicle.plate) { setError("Adicione o veículo do cliente."); return false; }
      } else {
        if (!clientId) { setError("Selecione um cliente."); return false; }
        if (!vehicleId && !pendingVehicle) { setError("Selecione ou adicione um veículo."); return false; }
      }
    }
    if (step === 2 && items.length === 0) { setError("Adicione pelo menos um serviço."); return false; }
    setError(""); return true;
  }

  function next() { if (validate()) setStep((s) => (s + 1) as Step); }
  function prev() { setError(""); setStep((s) => (s - 1) as Step); }

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      try {
        await createQuote({
          clientId: newClientMode ? undefined : clientId,
          vehicleId: newClientMode ? undefined : vehicleId || undefined,
          newClient: newClientMode ? { name: newClientForm.name, phone: newClientForm.phone } : undefined,
          newVehicle: pendingVehicle ? {
            plate: pendingVehicle.plate,
            brand: pendingVehicle.brand || undefined,
            brandCode: pendingVehicle.brandCode || undefined,
            model: pendingVehicle.model || undefined,
            modelCode: pendingVehicle.modelCode || undefined,
            year: pendingVehicle.year || undefined,
          } : undefined,
          items: items.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity, unitPrice: i.price })),
          vehicleNotes,
        });
        router.push("/dashboard/orcamentos");
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao criar orçamento.");
      }
    });
  }

  return (
    <div className="max-w-xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors flex-1 justify-center ${
              step === s.n
                ? "bg-amber-500 text-black font-semibold"
                : step > s.n
                ? "bg-green-100 dark:bg-green-600/20 text-green-700 dark:text-green-400"
                : "bg-gray-100 dark:bg-zinc-800 text-gray-400 dark:text-zinc-500"
            }`}>
              {step > s.n ? <Check className="w-3 h-3" /> : <s.icon className="w-3 h-3" />}
              <span className="hidden sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="w-3 h-px bg-gray-200 dark:bg-zinc-700 shrink-0" />}
          </div>
        ))}
      </div>

      {/* ── Step 1: Cliente + Veículo ── */}
      {step === 1 && (
        <div className="space-y-5">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Selecionar Cliente</h2>

          {!newClientMode ? (
            <>
              {/* Client search + list */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar por nome ou placa..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className={`${inputCls} pl-9`}
                />
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {filteredClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => selectClient(c.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                      clientId === c.id
                        ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                        : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700"
                    }`}
                  >
                    <p className="text-gray-900 dark:text-zinc-100 font-medium text-sm">{c.name}</p>
                    <p className="text-gray-400 dark:text-zinc-500 text-xs mt-0.5">
                      {c.vehicles.length === 0
                        ? "Sem veículos"
                        : c.vehicles.map((v) => v.plate).join(", ")}
                    </p>
                  </button>
                ))}
                {filteredClients.length === 0 && (
                  <p className="text-gray-400 dark:text-zinc-500 text-sm text-center py-4">Nenhum cliente encontrado.</p>
                )}
              </div>

              {/* Vehicle selection (shown after client is selected) */}
              {clientId && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                    Selecionar veículo
                  </p>

                  {clientVehicles.length === 0 && !showVehicleForm && (
                    <p className="text-gray-400 dark:text-zinc-500 text-sm">
                      Nenhum veículo cadastrado. Adicione um abaixo.
                    </p>
                  )}

                  {clientVehicles.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => { setVehicleId(v.id); setPendingVehicle(null); setShowVehicleForm(false); }}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${
                        vehicleId === v.id
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                          : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <Car className="w-4 h-4 text-gray-400 dark:text-zinc-500 shrink-0" />
                      <div>
                        <span className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-mono text-xs px-2 py-0.5 rounded">
                          {v.plate}
                        </span>
                        {vehicleDesc(v) && (
                          <p className="text-gray-500 dark:text-zinc-400 text-xs mt-0.5">{vehicleDesc(v)}</p>
                        )}
                      </div>
                      {vehicleId === v.id && <Check className="w-4 h-4 text-amber-500 ml-auto" />}
                    </button>
                  ))}

                  {/* Pending vehicle badge */}
                  {pendingVehicle && !showVehicleForm && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500 bg-amber-50 dark:bg-amber-500/10">
                      <Car className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex-1">
                        <span className="bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-xs px-2 py-0.5 rounded">
                          {pendingVehicle.plate}
                        </span>
                        {vehicleDesc({ brand: pendingVehicle.brand, model: pendingVehicle.model, year: pendingVehicle.year }) && (
                          <p className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">
                            {vehicleDesc({ brand: pendingVehicle.brand, model: pendingVehicle.model, year: pendingVehicle.year })}
                          </p>
                        )}
                        <p className="text-amber-500 text-xs opacity-70">Novo veículo — será criado com o orçamento</p>
                      </div>
                      <Check className="w-4 h-4 text-amber-500" />
                    </div>
                  )}

                  {!showVehicleForm && (
                    <button
                      onClick={() => { setShowVehicleForm(true); setVehicleId(""); }}
                      className="flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar novo veículo
                    </button>
                  )}

                  {showVehicleForm && (
                    <div className="border border-gray-200 dark:border-zinc-700 rounded-xl p-4 bg-gray-50 dark:bg-zinc-800/30">
                      <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Novo veículo</p>
                      <VehicleForm
                        onSave={(data) => { setPendingVehicle(data); setShowVehicleForm(false); }}
                        onCancel={() => setShowVehicleForm(false)}
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => { setNewClientMode(true); setClientId(""); setVehicleId(""); setPendingVehicle(null); setShowVehicleForm(false); }}
                className="flex items-center gap-2 text-amber-500 hover:text-amber-400 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Cadastrar novo cliente
              </button>
            </>
          ) : (
            /* New client mode */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-900 dark:text-zinc-100 font-medium text-sm">Novo cliente</p>
                <button
                  onClick={() => { setNewClientMode(false); setPendingVehicle(null); }}
                  className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 text-xs transition-colors"
                >
                  Usar existente
                </button>
              </div>
              {([
                ["name", "Nome *", "João Silva", "text"],
                ["phone", "Telefone / WhatsApp", "11999999999", "tel"],
              ] as [keyof typeof newClientForm, string, string, string][]).map(([field, label, ph, type]) => (
                <div key={field}>
                  <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block mb-1.5">{label}</label>
                  <input type={type} placeholder={ph} value={newClientForm[field]} onChange={(e) => setNewClientForm({ ...newClientForm, [field]: e.target.value })} className={inputCls} />
                </div>
              ))}

              <div className="border-t border-gray-200 dark:border-zinc-700 pt-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Veículo *</p>
                {pendingVehicle ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-500 bg-amber-50 dark:bg-amber-500/10">
                      <Car className="w-4 h-4 text-amber-500" />
                      <div className="flex-1">
                        <span className="font-mono text-xs">{pendingVehicle.plate}</span>
                        {vehicleDesc({ brand: pendingVehicle.brand, model: pendingVehicle.model, year: pendingVehicle.year }) && (
                          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                            {vehicleDesc({ brand: pendingVehicle.brand, model: pendingVehicle.model, year: pendingVehicle.year })}
                          </p>
                        )}
                      </div>
                      <button onClick={() => setPendingVehicle(null)} className="text-gray-400 hover:text-red-500 text-xs transition-colors">Alterar</button>
                    </div>
                  </div>
                ) : (
                  <VehicleForm
                    onSave={(data) => setPendingVehicle(data)}
                    onCancel={() => setNewClientMode(false)}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Serviços ── */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Adicionar Serviços</h2>
          {items.length > 0 && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-3 space-y-2">
              {items.map((item) => (
                <div key={item.serviceId} className="flex items-center gap-2">
                  <span className="text-gray-900 dark:text-zinc-100 text-sm flex-1 truncate">{item.title}</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setQty(item.serviceId, item.quantity - 1)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-gray-900 dark:text-zinc-100 text-sm w-5 text-center">{item.quantity}</span>
                    <button onClick={() => setQty(item.serviceId, item.quantity + 1)} className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-green-600 dark:text-green-400 text-xs w-20 text-right">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
              <div className="border-t border-gray-100 dark:border-zinc-800 pt-2 flex justify-between">
                <span className="text-gray-500 dark:text-zinc-400 text-sm">Total</span>
                <span className="text-green-600 dark:text-green-400 font-bold">R$ {total.toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
            <input type="text" placeholder="Buscar serviço..." value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} className={`${inputCls} pl-9`} />
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {filteredServices.map((s) => {
              const sel = items.some((i) => i.serviceId === s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleService(s)}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center justify-between ${
                    sel
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-500/10"
                      : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-gray-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div>
                    <p className="text-gray-900 dark:text-zinc-100 text-sm font-medium">{s.title}</p>
                    {s.duration_estimated && <p className="text-gray-400 dark:text-zinc-500 text-xs">{s.duration_estimated}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-green-600 dark:text-green-400 text-sm">R$ {Number(s.price).toFixed(2)}</span>
                    {sel && <Check className="w-4 h-4 text-amber-500" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 3: Observações ── */}
      {step === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Observações do Veículo</h2>
          <p className="text-gray-400 dark:text-zinc-500 text-sm">Registre avarias, arranhões ou condições especiais.</p>
          <textarea
            value={vehicleNotes}
            onChange={(e) => setVehicleNotes(e.target.value)}
            placeholder="Ex: Arranhão no para-choque traseiro, vidro do passageiro com mancha..."
            rows={6}
            className={`${inputCls} resize-none`}
          />
        </div>
      )}

      {/* ── Step 4: Revisão ── */}
      {step === 4 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">Revisão</h2>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
            <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wider mb-2">Cliente</p>
            {newClientMode ? (
              <>
                <p className="text-gray-900 dark:text-zinc-100 font-medium">
                  {newClientForm.name} <span className="text-amber-500 text-xs">(novo)</span>
                </p>
              </>
            ) : (
              <p className="text-gray-900 dark:text-zinc-100 font-medium">{selectedClient?.name}</p>
            )}
            <div className="mt-2 flex items-center gap-2">
              <span className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-mono text-xs px-2 py-0.5 rounded">
                {selectedVehicle?.plate ?? pendingVehicle?.plate}
              </span>
              {(() => {
                const v = selectedVehicle ?? (pendingVehicle ? { brand: pendingVehicle.brand, model: pendingVehicle.model, year: pendingVehicle.year } : null);
                const desc = v ? vehicleDesc({ brand: v.brand ?? null, model: v.model ?? null, year: v.year ?? null }) : "";
                return desc ? <span className="text-gray-500 dark:text-zinc-400 text-xs">{desc}</span> : null;
              })()}
              {pendingVehicle && !selectedVehicle && <span className="text-amber-500 text-xs">(novo)</span>}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
            <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wider mb-3">Serviços</p>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.serviceId} className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-zinc-400">{item.quantity}x {item.title}</span>
                  <span className="text-gray-900 dark:text-zinc-100">R$ {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-zinc-800 mt-3 pt-3 flex justify-between">
              <span className="text-gray-900 dark:text-zinc-100 font-medium">Total</span>
              <span className="text-green-600 dark:text-green-400 font-bold text-lg">R$ {total.toFixed(2)}</span>
            </div>
          </div>
          {vehicleNotes && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
              <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wider mb-2">Observações</p>
              <p className="text-gray-600 dark:text-zinc-400 text-sm whitespace-pre-wrap">{vehicleNotes}</p>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      <div className="flex gap-3 mt-8">
        {step > 1 && (
          <button onClick={prev} className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </button>
        )}
        <div className="flex-1" />
        {step < 4 ? (
          <button onClick={next} className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors">
            Próximo
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={isPending} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60">
            {isPending ? "Criando..." : "Criar Orçamento"}
          </button>
        )}
      </div>
    </div>
  );
}
