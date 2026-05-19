"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Users, Wrench, FileText, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/theme-toggle";
import { VrummLogo } from "@/components/layout/vrumm-logo";

const navItems = [
  { href: "/dashboard",                  label: "Dashboard",     icon: LayoutDashboard },
  { href: "/dashboard/clientes",         label: "Clientes",      icon: Users },
  { href: "/dashboard/servicos",         label: "Serviços",      icon: Wrench },
  { href: "/dashboard/orcamentos",       label: "Orçamentos",    icon: FileText },
  { href: "/dashboard/configuracoes",    label: "Configurações", icon: Settings },
];

interface SidebarProps {
  userName: string;
  tenantName: string;
}

export function Sidebar({ userName, tenantName }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen fixed left-0 top-0 bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-200 dark:border-zinc-800">
          <VrummLogo
            iconSize={30}
            textClass="text-lg text-gray-900 dark:text-zinc-100"
          />
          <p className="font-sans text-xs truncate mt-2 text-gray-400 dark:text-zinc-500 pl-[42px]">
            {tenantName}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all",
                  active
                    ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-zinc-800/50 hover:text-gray-900 dark:hover:text-zinc-100"
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-zinc-800 space-y-1">
          <div className="flex items-center justify-between px-1">
            <p className="font-sans text-xs truncate text-gray-400 dark:text-zinc-500">
              {userName}
            </p>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded-lg text-gray-400 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 z-50">
        <div className="flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-3 transition-colors",
                  active ? "text-amber-500" : "text-gray-400 dark:text-zinc-500"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
