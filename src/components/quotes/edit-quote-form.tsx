"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Minus, Check, RefreshCw } from "lucide-react";
import { updateQuote } from "@/app/actions/quotes";

type Service = { id: string; title: string; price: number; duration_estimated: string | null };
type SelectedItem = { serviceId: string; title: string; unitPrice: number; quantity: number };

type QuoteItem = {
  service_id: string;
  quantity: number;
  unit_price: number;
  services: { id: string; title: string; price: number } | null;
};

type Vehicle = { plate: string; brand: string | null; model: string | null; year: string | null };

type Quote = {
  id: string;
  total_value: number;
  vehicle_notes: string | null;
  clients: { name: string } | null;
  vehicles: Vehicle | null;
  quote_items: QuoteItem[];
};

function vehicleDesc(v: Vehicle) {
  return [v.brand, v.model, v.year].filter(Boolean).join(" ");
}

const inputCls =
  "w-full bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg text-sm px-3 py-2 text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors";

export function EditQuoteForm({ quote, allServices }: { quote: Quote; allServices: Service[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [items, setItems] = useState<SelectedItem[]>(
    quote.quote_items.map((qi) => ({
      serviceId: qi.service_id,
      title: qi.services?.title ?? "Serviço",
      unitPrice: Number(qi.unit_price),
      quantity: qi.quantity,
    }))
  );

  const [serviceSearch, setServiceSearch] = useState("");
  const [vehicleNotes, setVehicleNotes] = useState(quote.vehicle_notes ?? "");

  const calculatedTotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  // Verifica se o total original já era customizado (diferente da soma dos itens)
  const initialCalculated = useRef(
    quote.quote_items.reduce((s, qi) => s + Number(qi.unit_price) * qi.quantity, 0)
  );
  const [isAutoTotal, setIsAutoTotal] = useState(
    Math.abs(Number(quote.total_value) - initialCalculated.current) < 0.01
  );
  const [totalStr, setTotalStr] = useState(String(Number(quote.total_value).toFixed(2)));

  // Sincroniza o total automaticamente quando itens mudam (se não for customizado)
  useEffect(() => {
    if (isAutoTotal) setTotalStr(calculatedTotal.toFixed(2));
  }, [calculatedTotal, isAutoTotal]);

  const totalValue = parseFloat(totalStr.replace(",", ".")) || 0;
  const hasCustomTotal = !isAutoTotal;

  const filteredServices = allServices.filter(
    (s) =>
      s.title.toLowerCase().includes(serviceSearch.toLowerCase()) &&
      !items.some((i) => i.serviceId === s.id)
  );

  function addService(s: Service) {
    setItems((prev) => [
      ...prev,
      { serviceId: s.id, title: s.title, unitPrice: Number(s.price), quantity: 1 },
    ]);
    setServiceSearch("");
  }

  function removeItem(serviceId: string) {
    setItems((prev) => prev.filter((i) => i.serviceId !== serviceId));
  }

  function setQty(serviceId: string, qty: number) {
    if (qty < 1) return;
    setItems((prev) => prev.map((i) => (i.serviceId === serviceId ? { ...i, quantity: qty } : i)));
  }

  function syncTotal() {
    setTotalStr(calculatedTotal.toFixed(2));
    setIsAutoTotal(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) { setError("Adicione pelo menos um serviço."); return; }
    if (isNaN(totalValue) || totalValue < 0) { setError("Valor total inválido."); return; }
    setError("");
    startTransition(async () => {
      try {
        await updateQuote({
          id: quote.id,
          items: items.map((i) => ({ serviceId: i.serviceId, quantity: i.quantity, unitPrice: i.unitPrice })),
          totalValue,
          vehicleNotes,
        });
        router.push("/dashboard/orcamentos");
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro ao salvar.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-6">

      {/* Cliente (somente leitura) */}
      <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4">
        <p className="text-gray-400 dark:text-zinc-500 text-xs uppercase tracking-wider mb-1">Cliente</p>
        <p className="text-gray-900 dark:text-zinc-100 font-medium">{quote.clients?.name ?? "—"}</p>
        {quote.vehicles && (
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-mono text-xs px-2 py-0.5 rounded">
              {quote.vehicles.plate}
            </span>
            {vehicleDesc(quote.vehicles) && (
              <span className="text-gray-400 dark:text-zinc-500 text-xs">{vehicleDesc(quote.vehicles)}</span>
            )}
          </div>
        )}
      </div>

      {/* Serviços selecionados */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">Serviços</p>

        {items.length === 0 ? (
          <p className="text-gray-400 dark:text-zinc-500 text-sm py-2">Nenhum serviço adicionado.</p>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl divide-y divide-gray-100 dark:divide-zinc-800">
            {items.map((item) => (
              <div key={item.serviceId} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 dark:text-zinc-100 text-sm font-medium truncate">{item.title}</p>
                  <p className="text-gray-400 dark:text-zinc-500 text-xs">
                    R$ {item.unitPrice.toFixed(2)} / un
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQty(item.serviceId, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-gray-900 dark:text-zinc-100 text-sm w-5 text-center font-medium">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQty(item.serviceId, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <span className="text-green-600 dark:text-green-400 text-sm w-20 text-right font-semibold">
                    R$ {(item.unitPrice * item.quantity).toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.serviceId)}
                    className="ml-1 text-gray-300 dark:text-zinc-600 hover:text-red-500 transition-colors text-xs font-medium"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Adicionar serviço */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar serviço para adicionar..."
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              className={`${inputCls} pl-9`}
            />
          </div>
          {serviceSearch && (
            <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
              {filteredServices.length === 0 ? (
                <p className="text-gray-400 dark:text-zinc-500 text-sm text-center py-4">
                  {allServices.some((s) => items.find((i) => i.serviceId === s.id) && s.title.toLowerCase().includes(serviceSearch.toLowerCase()))
                    ? "Serviço já adicionado."
                    : "Nenhum serviço encontrado."}
                </p>
              ) : (
                filteredServices.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => addService(s)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors border-b border-gray-100 dark:border-zinc-800 last:border-0 text-left"
                  >
                    <div>
                      <p className="text-gray-900 dark:text-zinc-100 text-sm font-medium">{s.title}</p>
                      {s.duration_estimated && (
                        <p className="text-gray-400 dark:text-zinc-500 text-xs">{s.duration_estimated}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-green-600 dark:text-green-400 text-sm">R$ {Number(s.price).toFixed(2)}</span>
                      <Check className="w-4 h-4 text-amber-500 opacity-0 group-hover:opacity-100" />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Valor total */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
            Valor total (R$)
          </label>
          {hasCustomTotal && (
            <button
              type="button"
              onClick={syncTotal}
              className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Usar calculado (R$ {calculatedTotal.toFixed(2)})
            </button>
          )}
          {!hasCustomTotal && items.length > 0 && (
            <span className="text-xs text-gray-400 dark:text-zinc-500">
              Calculado dos serviços
            </span>
          )}
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          value={totalStr}
          onChange={(e) => {
            setTotalStr(e.target.value);
            setIsAutoTotal(false);
          }}
          className={inputCls}
        />
        {hasCustomTotal && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Valor personalizado — diferente do total dos serviços (R$ {calculatedTotal.toFixed(2)}).
            Útil para aplicar descontos.
          </p>
        )}
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider block">
          Observações do veículo
        </label>
        <textarea
          value={vehicleNotes}
          onChange={(e) => setVehicleNotes(e.target.value)}
          placeholder="Ex: Arranhão no para-choque, vidro com mancha..."
          rows={4}
          className={`${inputCls} resize-none`}
        />
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 py-2.5 text-sm font-medium bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-600 dark:text-zinc-300 rounded-lg transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-black py-2.5 text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
