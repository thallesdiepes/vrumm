"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Em produção, enviar para serviço de monitoramento (Sentry, etc.)
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <h1 className="text-lg font-semibold">Algo deu errado</h1>
          <p className="text-zinc-400 text-sm">
            Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte se o problema persistir.
          </p>
          {error.digest && (
            <p className="font-mono text-xs text-zinc-600">ID: {error.digest}</p>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-2 mx-auto bg-amber-500 hover:bg-amber-400 text-black text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
