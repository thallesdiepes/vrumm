"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X, Pencil, Download, CheckCircle, Clock, Loader, Package, MapPin, Phone, Hash, MessageCircle } from "lucide-react";

type QuoteItem = {
  id: string;
  quantity: number;
  unit_price: number;
  services: { title: string } | null;
};

type Client = { name: string; phone: string | null };
type Vehicle = { plate: string; brand: string | null; model: string | null; year: string | null };

export type ModalQuote = {
  id: string;
  status: string;
  total_value: number;
  created_at: string;
  vehicle_notes?: string | null;
  clients: Client | null;
  vehicles: Vehicle | null;
  quote_items: QuoteItem[];
};

function vehicleDesc(v: Vehicle) {
  return [v.brand, v.model, v.year].filter(Boolean).join(" ");
}

export type ModalTenant = {
  name: string;
  cnpj: string | null;
  address: string | null;
  whatsapp_number: string | null;
};

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; Icon: typeof Clock }> = {
  "Aguardando Aprovacao": { label: "Aguardando Aprovação", color: "text-amber-700", bg: "bg-amber-50 border-amber-200",  Icon: Clock },
  "Em Execucao":          { label: "Em Execução",          color: "text-blue-700",  bg: "bg-blue-50 border-blue-200",   Icon: Loader },
  "Pronto":               { label: "Pronto para Entrega",  color: "text-green-700", bg: "bg-green-50 border-green-200", Icon: CheckCircle },
  "Entregue":             { label: "Entregue",             color: "text-gray-600",  bg: "bg-gray-50 border-gray-200",   Icon: Package },
};

export function QuoteDetailModal({
  quote,
  tenant,
  onClose,
}: {
  quote: ModalQuote;
  tenant: ModalTenant;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const status = STATUS_MAP[quote.status] ?? STATUS_MAP["Aguardando Aprovacao"];
  const { Icon } = status;
  const date = new Date(quote.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const quoteRef = quote.id.slice(-6).toUpperCase();

  function buildWhatsAppLink() {
    const quoteUrl = `${window.location.origin}/q/${quote.id}`;
    const total = Number(quote.total_value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const msg = [
      `Olá, ${quote.clients?.name ?? "cliente"}! 👋`,
      ``,
      `Seu orçamento da *${tenant.name}* está pronto.`,
      ``,
      `🔗 Acesse aqui: ${quoteUrl}`,
      `💰 Total: *${total}*`,
      ``,
      `Qualquer dúvida, estamos à disposição!`,
    ].join("\n");

    const rawPhone = quote.clients?.phone?.replace(/\D/g, "") ?? "";
    const phone = rawPhone ? (rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`) : "";

    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-zinc-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toolbar — oculta no PDF */}
        <div className="no-print flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
          <div className="flex items-center gap-2">
            <Link
              href={`/dashboard/orcamentos/${quote.id}/editar`}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Editar
            </Link>
            <a
              href={buildWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-green-500 hover:bg-green-400 px-3 py-1.5 rounded-lg transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conteúdo do orçamento — marcado para impressão */}
        <div className="quote-print-area flex-1">

          {/* Cabeçalho da estética */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">vrumm</p>
              <h2 className="text-base font-bold text-gray-900 dark:text-zinc-100 truncate">{tenant.name}</h2>
              {tenant.cnpj && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 flex items-center gap-1">
                  <Hash className="w-3 h-3 shrink-0" /> {tenant.cnpj}
                </p>
              )}
              {tenant.address && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" /> {tenant.address}
                </p>
              )}
              {tenant.whatsapp_number && (
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5 flex items-center gap-1">
                  <Phone className="w-3 h-3 shrink-0" /> {tenant.whatsapp_number}
                </p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Orçamento</p>
              <p className="font-mono font-bold text-gray-900 dark:text-zinc-100">#{quoteRef}</p>
              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5">{date}</p>
            </div>
          </div>

          {/* Status */}
          <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${status.bg} ${status.color}`}>
              <Icon className="w-3.5 h-3.5" />
              {status.label}
            </div>
          </div>

          {/* Cliente */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Cliente</p>
            <p className="text-gray-900 dark:text-zinc-100 font-semibold">{quote.clients?.name ?? "—"}</p>
            {quote.vehicles && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 px-2 py-0.5 rounded font-mono text-xs">
                  {quote.vehicles.plate}
                </span>
                {vehicleDesc(quote.vehicles) && (
                  <span className="text-gray-400 dark:text-zinc-500 text-xs">{vehicleDesc(quote.vehicles)}</span>
                )}
              </div>
            )}
          </div>

          {/* Serviços */}
          <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Serviços</p>
            <div className="space-y-2.5">
              {quote.quote_items.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-4">
                  <span className="text-gray-700 dark:text-zinc-300 text-sm">
                    <span className="text-gray-400 dark:text-zinc-500">{item.quantity}x </span>
                    {item.services?.title}
                  </span>
                  <span className="text-gray-900 dark:text-zinc-100 text-sm font-medium shrink-0">
                    R$ {(Number(item.unit_price) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 dark:border-zinc-800 mt-4 pt-4 flex justify-between items-center">
              <span className="text-gray-700 dark:text-zinc-300 font-semibold text-sm">Total</span>
              <span className="text-green-600 dark:text-green-400 font-bold text-xl">
                R$ {Number(quote.total_value).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Observações */}
          {quote.vehicle_notes && (
            <div className="px-6 py-5 border-b border-gray-100 dark:border-zinc-800">
              <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Observações do veículo</p>
              <p className="text-gray-600 dark:text-zinc-400 text-sm whitespace-pre-wrap leading-relaxed">{quote.vehicle_notes}</p>
            </div>
          )}

          {/* Rodapé */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-zinc-900/50 flex justify-between items-center">
            <p className="text-gray-400 dark:text-zinc-500 text-xs">
              Gerado por <span className="text-amber-500 font-medium">vrumm</span>
            </p>
            <p className="text-gray-300 dark:text-zinc-700 text-[10px] font-mono">{quote.id}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
