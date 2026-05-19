"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, ChevronRight, ChevronLeft, Trash2, ExternalLink, FileText, Pencil } from "lucide-react";
import { updateQuoteStatus, deleteQuote } from "@/app/actions/quotes";
import { QuoteDetailModal, type ModalQuote, type ModalTenant } from "@/components/quotes/quote-detail-modal";
import { showToast } from "@/components/ui/toast";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

type QuoteItem = {
  id: string;
  quantity: number;
  unit_price: number;
  services: { title: string } | null;
};

type Client = { name: string; phone: string | null };
type Vehicle = { plate: string; brand: string | null; model: string | null; year: string | null };

type Quote = {
  id: string;
  status: string;
  total_value: number;
  vehicle_notes?: string | null;
  created_at: string;
  clients: Client | null;
  vehicles: Vehicle | null;
  quote_items: QuoteItem[];
};

function vehicleDesc(v: Vehicle) {
  return [v.brand, v.model, v.year].filter(Boolean).join(" ");
}

const STATUSES = [
  {
    key: "Aguardando Aprovacao",
    label: "Aguardando",
    dot: "bg-amber-400",
    labelColor: "text-amber-600 dark:text-amber-400",
    headerBg: "bg-amber-50 dark:bg-amber-400/10",
    headerBorder: "border-amber-200 dark:border-amber-400/20",
    dropBg: "bg-amber-50/60 dark:bg-amber-400/5",
  },
  {
    key: "Em Execucao",
    label: "Em Execução",
    dot: "bg-blue-400",
    labelColor: "text-blue-600 dark:text-blue-400",
    headerBg: "bg-blue-50 dark:bg-blue-400/10",
    headerBorder: "border-blue-200 dark:border-blue-400/20",
    dropBg: "bg-blue-50/60 dark:bg-blue-400/5",
  },
  {
    key: "Pronto",
    label: "Pronto",
    dot: "bg-green-400",
    labelColor: "text-green-600 dark:text-green-400",
    headerBg: "bg-green-50 dark:bg-green-400/10",
    headerBorder: "border-green-200 dark:border-green-400/20",
    dropBg: "bg-green-50/60 dark:bg-green-400/5",
  },
  {
    key: "Entregue",
    label: "Entregue",
    dot: "bg-gray-400 dark:bg-zinc-500",
    labelColor: "text-gray-500 dark:text-zinc-400",
    headerBg: "bg-gray-50 dark:bg-zinc-800/50",
    headerBorder: "border-gray-200 dark:border-zinc-700",
    dropBg: "bg-gray-50/60 dark:bg-zinc-800/30",
  },
];

/* ── Droppable column ── */
function DroppableColumn({ colKey, dropBg, children }: { colKey: string; dropBg: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: colKey });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-24 space-y-3 rounded-xl p-1 -m-1 transition-colors duration-150 ${isOver ? dropBg : ""}`}
    >
      {children}
    </div>
  );
}

/* ── Draggable card ── */
function DraggableCard({
  quote,
  colIdx,
  isPending,
  onChangeStatus,
  onDelete,
  onOpen,
}: {
  quote: Quote;
  colIdx: number;
  isPending: boolean;
  onChangeStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onOpen: (quote: Quote) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: quote.id,
    data: { colIdx },
  });

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;
  const prev = STATUSES[colIdx - 1];
  const next = STATUSES[colIdx + 1];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-sm transition-all touch-none select-none ${
        isDragging
          ? "opacity-40 shadow-none cursor-grabbing"
          : "hover:border-gray-300 dark:hover:border-zinc-700 cursor-grab"
      }`}
    >
      {/* Área clicável — abre o modal */}
      <div
        className="p-4 space-y-3"
        onClick={() => !isDragging && onOpen(quote)}
      >
        <div>
          <p className="text-gray-900 dark:text-zinc-100 font-medium text-sm leading-tight">
            {quote.clients?.name ?? "—"}
          </p>
          {quote.vehicles && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 px-1.5 py-0.5 rounded text-xs font-mono">
                {quote.vehicles.plate}
              </span>
              {vehicleDesc(quote.vehicles) && (
                <span className="text-gray-400 dark:text-zinc-500 text-xs truncate">{vehicleDesc(quote.vehicles)}</span>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 dark:text-zinc-500 space-y-0.5">
          {quote.quote_items.slice(0, 2).map((item) => (
            <p key={item.id}>{item.quantity}x {item.services?.title}</p>
          ))}
          {quote.quote_items.length > 2 && <p>+{quote.quote_items.length - 2} serviço(s)</p>}
        </div>

        <div className="flex items-center justify-between">
          <span className="text-green-600 dark:text-green-400 font-bold text-sm">
            R$ {Number(quote.total_value).toFixed(2)}
          </span>
          <span className="text-gray-400 dark:text-zinc-500 text-xs">
            {new Date(quote.created_at).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>

      {/* Rodapé com ações — não propaga click nem drag */}
      <div
        className="flex items-center justify-between px-4 pb-3 pt-0 border-t border-gray-100 dark:border-zinc-800 mt-0 pt-2.5"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center">
          {prev && (
            <button
              onClick={() => onChangeStatus(quote.id, prev.key)}
              disabled={isPending}
              title={`Mover para ${prev.label}`}
              className="text-gray-300 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-300 p-1 rounded transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {next && (
            <button
              onClick={() => onChangeStatus(quote.id, next.key)}
              disabled={isPending}
              title={`Mover para ${next.label}`}
              className="text-gray-300 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-300 p-1 rounded transition-colors disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          <Link
            href={`/dashboard/orcamentos/${quote.id}/editar`}
            title="Editar orçamento"
            className="text-gray-400 dark:text-zinc-500 hover:text-amber-500 p-1 rounded transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/q/${quote.id}`}
            target="_blank"
            title="Link público"
            className="text-gray-400 dark:text-zinc-500 hover:text-amber-500 p-1 rounded transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => onDelete(quote.id)}
            disabled={isPending}
            title="Excluir"
            className="text-gray-400 dark:text-zinc-500 hover:text-red-500 p-1 rounded transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Ghost card durante drag ── */
function CardGhost({ quote }: { quote: Quote }) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-amber-400/60 rounded-xl p-4 space-y-2 shadow-2xl rotate-2 opacity-95 w-[272px]">
      <p className="text-gray-900 dark:text-zinc-100 font-medium text-sm">{quote.clients?.name ?? "—"}</p>
      {quote.vehicles && (
        <span className="bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 px-1.5 py-0.5 rounded text-xs font-mono">
          {quote.vehicles.plate}
        </span>
      )}
      <p className="text-green-600 dark:text-green-400 font-bold text-sm">
        R$ {Number(quote.total_value).toFixed(2)}
      </p>
    </div>
  );
}

/* ── Board principal ── */
export function QuotesBoard({
  initialQuotes,
  tenant,
}: {
  initialQuotes: Quote[];
  tenant: ModalTenant;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [activeQuote, setActiveQuote] = useState<Quote | null>(null);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function changeStatus(id: string, status: string) {
    startTransition(async () => {
      try {
        await updateQuoteStatus(id, status);
        router.refresh();
      } catch {
        showToast("Não foi possível mover o orçamento. Tente novamente.");
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Excluir este orçamento?")) return;
    startTransition(async () => {
      try {
        await deleteQuote(id);
        router.refresh();
      } catch {
        showToast("Não foi possível excluir o orçamento. Tente novamente.");
      }
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveQuote(initialQuotes.find((q) => q.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveQuote(null);
    const { active, over } = event;
    if (!over) return;
    const quote = initialQuotes.find((q) => q.id === active.id);
    if (!quote || over.id === quote.status) return;
    changeStatus(quote.id, over.id as string);
  }

  if (initialQuotes.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-zinc-500">
        <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="mb-4">Nenhum orçamento criado ainda.</p>
        <Link
          href="/dashboard/orcamentos/novo"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Criar primeiro orçamento
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-6">
        <Link
          href="/dashboard/orcamentos/novo"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Orçamento
        </Link>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map((col, colIdx) => {
            const quotes = initialQuotes.filter((q) => q.status === col.key);

            return (
              <div key={col.key} className="min-w-[272px] w-[272px] shrink-0">
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-lg border mb-3 ${col.headerBg} ${col.headerBorder}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <span className={`text-sm font-semibold ${col.labelColor}`}>{col.label}</span>
                  </div>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full bg-white/70 dark:bg-zinc-900/70 ${col.labelColor}`}>
                    {quotes.length}
                  </span>
                </div>

                <DroppableColumn colKey={col.key} dropBg={col.dropBg}>
                  {quotes.length === 0 && (
                    <div className="text-center py-8 text-gray-300 dark:text-zinc-600 text-sm border border-dashed border-gray-200 dark:border-zinc-700 rounded-xl">
                      Solte aqui
                    </div>
                  )}
                  {quotes.map((quote) => (
                    <DraggableCard
                      key={quote.id}
                      quote={quote}
                      colIdx={colIdx}
                      isPending={isPending}
                      onChangeStatus={changeStatus}
                      onDelete={handleDelete}
                      onOpen={setSelectedQuote}
                    />
                  ))}
                </DroppableColumn>
              </div>
            );
          })}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeQuote ? <CardGhost quote={activeQuote} /> : null}
        </DragOverlay>
      </DndContext>

      {selectedQuote && (
        <QuoteDetailModal
          quote={selectedQuote as ModalQuote}
          tenant={tenant}
          onClose={() => setSelectedQuote(null)}
        />
      )}
    </>
  );
}
