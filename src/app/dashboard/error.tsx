"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-zinc-100">
          Erro ao carregar página
        </h1>
        <p className="text-gray-500 dark:text-zinc-400 text-sm">
          {error.message || "Não foi possível carregar os dados. Verifique sua conexão e tente novamente."}
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-gray-400 dark:text-zinc-600">ID: {error.digest}</p>
        )}
        <div className="flex items-center gap-3 justify-center pt-2">
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
