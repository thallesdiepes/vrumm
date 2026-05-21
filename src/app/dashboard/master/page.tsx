import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Building2, CheckCircle, XCircle, Clock, ChevronRight } from "lucide-react";

const MASTER_EMAIL = "thallesmalinidiepes@gmail.com";

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active:   { label: "Ativo",    color: "text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-500/10 dark:border-green-500/20" },
  inactive: { label: "Inativo",  color: "text-gray-500 bg-gray-50 border-gray-200 dark:text-zinc-400 dark:bg-zinc-800 dark:border-zinc-700" },
  past_due: { label: "Atrasado", color: "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20" },
  canceled: { label: "Cancelado",color: "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20" },
};

export default async function MasterPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user?.email !== MASTER_EMAIL) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: tenants, error } = await admin
    .from("tenants")
    .select("id, name, subscription_status, created_at, whatsapp_number")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500 text-sm">Erro ao carregar tenants: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Painel Master</h1>
        <p className="text-gray-400 dark:text-zinc-500 text-sm mt-1">
          {tenants?.length ?? 0} cliente{(tenants?.length ?? 0) !== 1 ? "s" : ""} cadastrado{(tenants?.length ?? 0) !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-3">
        {tenants?.map((t) => {
          const badge = STATUS_BADGE[t.subscription_status] ?? STATUS_BADGE.inactive;
          const date = new Date(t.created_at).toLocaleDateString("pt-BR");

          return (
            <Link
              key={t.id}
              href={`/dashboard/master/${t.id}`}
              className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-5 py-4 hover:border-amber-400/60 dark:hover:border-amber-400/40 transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-gray-900 dark:text-zinc-100 font-medium text-sm truncate">{t.name}</p>
                  <p className="text-gray-400 dark:text-zinc-500 text-xs mt-0.5">Desde {date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${badge.color}`}>
                  {badge.label}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-amber-400 transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
