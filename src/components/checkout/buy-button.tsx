"use client";

import { useTransition } from "react";
import { createCheckoutSession } from "@/app/actions/stripe";
import { showToast } from "@/components/ui/toast";

/**
 * Botão que dispara o Stripe Checkout via Server Action.
 *
 * A action chama `redirect(session.url)` no servidor — o Next propaga
 * pro client como navegação. Erros reais (env var ausente, lookup_key
 * não encontrada, etc.) viram toast.
 *
 * Não wrappa em <div> pra preservar layouts flex/grid do pai.
 */
export function BuyButton({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        await createCheckoutSession();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        // NEXT_REDIRECT é o "erro" lançado pelo redirect() — não é falha real
        if (!msg.includes("NEXT_REDIRECT")) {
          console.error("[BuyButton]", e);
          showToast(
            "Não foi possível iniciar o checkout. Tente novamente em instantes."
          );
        }
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={className}
    >
      {pending ? "Redirecionando..." : children}
    </button>
  );
}
