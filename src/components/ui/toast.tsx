"use client";

import { useState, useCallback, useEffect } from "react";
import { X, AlertTriangle, CheckCircle } from "lucide-react";

type Toast = { id: number; message: string; type: "error" | "success" };

let listeners: ((t: Toast) => void)[] = [];
let nextId = 0;

export function showToast(message: string, type: "error" | "success" = "error") {
  const toast: Toast = { id: nextId++, message, type };
  listeners.forEach((l) => l(toast));
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
  }, []);

  useEffect(() => {
    listeners.push(add);
    return () => { listeners = listeners.filter((l) => l !== add); };
  }, [add]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-in slide-in-from-right-4 ${
            t.type === "error"
              ? "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
              : "bg-green-50 dark:bg-green-950/60 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
          }`}
        >
          {t.type === "error"
            ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            : <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span className="flex-1">{t.message}</span>
          <button
            onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
