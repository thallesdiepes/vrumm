import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toast";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_active, tenants(name)")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active) redirect("/aguardando");

  const tenants = profile?.tenants as { name: string } | { name: string }[] | null;
  const tenantName =
    (Array.isArray(tenants) ? tenants[0]?.name : tenants?.name) ?? "Minha Estética";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
      <Sidebar
        userName={profile?.full_name ?? user.email ?? ""}
        tenantName={tenantName}
        userEmail={user.email ?? undefined}
      />
      <main className="md:ml-64 pb-20 md:pb-0 min-h-screen">
        {children}
      </main>
      <Toaster />
    </div>
  );
}
