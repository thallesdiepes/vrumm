export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckCircle, Clock, Loader, Package, MapPin, Phone, Hash } from "lucide-react";
import { PrintButton } from "@/components/quotes/print-button";
import { VrummIconMark } from "@/components/layout/vrumm-logo";

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; Icon: typeof Clock }> = {
  "Aguardando Aprovacao": { label: "Aguardando Aprovação", color: "text-amber-600  print:text-amber-700",  bg: "bg-amber-50  print:bg-amber-50  border-amber-200",  Icon: Clock },
  "Em Execucao":          { label: "Em Execução",          color: "text-blue-600   print:text-blue-700",   bg: "bg-blue-50   print:bg-blue-50   border-blue-200",   Icon: Loader },
  "Pronto":               { label: "Pronto para Entrega",  color: "text-green-600  print:text-green-700",  bg: "bg-green-50  print:bg-green-50  border-green-200",  Icon: CheckCircle },
  "Entregue":             { label: "Entregue",             color: "text-gray-500   print:text-gray-600",   bg: "bg-gray-50   print:bg-gray-50   border-gray-200",   Icon: Package },
};

export default async function PublicQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: quote, error } = await supabase
    .from("quotes")
    .select(`
      id, status, total_value, vehicle_notes, created_at,
      clients(name),
      vehicles(plate, brand, model, year),
      tenants(name, cnpj, address, whatsapp_number),
      quote_items(id, quantity, unit_price, services(title))
    `)
    .eq("id", id)
    .single();

  if (error) console.error("[/q/[id]] supabase error:", error.message, error.code);
  if (!quote) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = quote as any;
  const tenant = (Array.isArray(raw.tenants) ? raw.tenants[0] : raw.tenants) as {
    name: string; cnpj: string | null; address: string | null; whatsapp_number: string | null;
  } | null;
  const client = (Array.isArray(raw.clients) ? raw.clients[0] : raw.clients) as {
    name: string;
  } | null;
  const vehicle = (Array.isArray(raw.vehicles) ? raw.vehicles[0] : raw.vehicles) as {
    plate: string; brand: string | null; model: string | null; year: string | null;
  } | null;
  function vehicleDesc(v: NonNullable<typeof vehicle>) {
    return [v.brand, v.model, v.year].filter(Boolean).join(" ");
  }
  const items = (raw.quote_items ?? []) as {
    id: string; quantity: number; unit_price: number; services: { title: string } | null;
  }[];

  const status = STATUS_MAP[quote.status] ?? STATUS_MAP["Aguardando Aprovacao"];
  const { Icon } = status;
  const date = new Date(quote.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const quoteRef = quote.id.slice(-6).toUpperCase();

  return (
    <main className="min-h-screen bg-gray-100 print:bg-white py-10 px-4 print:py-0 print:px-0">
      <div className="max-w-2xl mx-auto">

        {/* Botão de download — oculto no print via .no-print */}
        <div className="flex justify-end mb-4 no-print">
          <PrintButton />
        </div>

        {/* Documento */}
        <div className="bg-white rounded-2xl print:rounded-none shadow-sm print:shadow-none overflow-hidden border border-gray-200 print:border-0">

          {/* Cabeçalho da estética */}
          <div className="px-8 py-7 border-b border-gray-100 print:border-gray-200 flex items-start justify-between gap-6">
            <div>
              <div className="mb-2">
                <VrummIconMark size={28} />
              </div>
              <h1 className="text-xl font-bold text-gray-900">{tenant?.name ?? "Estética"}</h1>
              {tenant?.cnpj && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5" /> CNPJ: {tenant.cnpj}
                </p>
              )}
              {tenant?.address && (
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {tenant.address}
                </p>
              )}
              {tenant?.whatsapp_number && (
                <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> {tenant.whatsapp_number}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Orçamento</p>
              <p className="font-mono font-bold text-gray-900 text-lg">#{quoteRef}</p>
              <p className="text-sm text-gray-400 mt-0.5">{date}</p>
            </div>
          </div>

          {/* Status */}
          <div className="px-8 py-4 border-b border-gray-100 print:border-gray-200">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-semibold ${status.bg} ${status.color}`}>
              <Icon className="w-4 h-4" />
              {status.label}
            </div>
          </div>

          {/* Cliente */}
          <div className="px-8 py-6 border-b border-gray-100 print:border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Cliente</p>
            <p className="text-gray-900 font-semibold text-base">{client?.name}</p>
            {vehicle && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono text-sm">{vehicle.plate}</span>
                {vehicleDesc(vehicle) && <span className="text-gray-500 text-sm">{vehicleDesc(vehicle)}</span>}
              </div>
            )}
          </div>

          {/* Serviços */}
          <div className="px-8 py-6 border-b border-gray-100 print:border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Serviços</p>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-4">
                  <span className="text-gray-700 text-sm">
                    <span className="text-gray-400 mr-1">{item.quantity}x</span>
                    {item.services?.title}
                  </span>
                  <span className="text-gray-900 text-sm font-medium shrink-0">
                    R$ {(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 mt-5 pt-4 flex justify-between items-center">
              <span className="text-gray-700 font-semibold">Total</span>
              <span className="text-green-600 font-bold text-2xl">
                R$ {Number(quote.total_value).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Observações */}
          {quote.vehicle_notes && (
            <div className="px-8 py-6 border-b border-gray-100 print:border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Observações do veículo</p>
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{quote.vehicle_notes}</p>
            </div>
          )}

          {/* Rodapé */}
          <div className="px-8 py-5 bg-gray-50 print:bg-white flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
              <VrummIconMark size={16} />
              <span>vrumm</span>
            </div>
            <p className="text-gray-300 text-xs font-mono">{quote.id}</p>
          </div>
        </div>
      </div>
    </main>
  );
}
