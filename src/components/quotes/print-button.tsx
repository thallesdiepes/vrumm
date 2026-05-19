"use client";

import { Download } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
    >
      <Download className="w-4 h-4" />
      Baixar PDF
    </button>
  );
}
