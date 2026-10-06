-- Migration: data de entrega do orçamento (dashboard mês a mês)
-- Execute INTEIRO no SQL Editor do Supabase ANTES do deploy do código
-- (o dashboard novo lê quotes.delivered_at; o código antigo ignora a coluna).

BEGIN;

ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

-- Preenche delivered_at quando o status vira 'Entregue' e limpa quando sai.
-- Trigger no banco: vale para Kanban, edição ou qualquer outro caminho.
CREATE OR REPLACE FUNCTION public.set_quote_delivered_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'Entregue' THEN
    IF TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'Entregue' OR NEW.delivered_at IS NULL THEN
      NEW.delivered_at := now();
    END IF;
  ELSE
    NEW.delivered_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS quotes_set_delivered_at ON public.quotes;
CREATE TRIGGER quotes_set_delivered_at
  BEFORE INSERT OR UPDATE OF status ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.set_quote_delivered_at();

-- Histórico: entregues antes desta migration não têm a data real.
-- Aproximação combinada: usa a data de criação.
UPDATE public.quotes
SET delivered_at = created_at
WHERE status = 'Entregue' AND delivered_at IS NULL;

CREATE INDEX IF NOT EXISTS quotes_tenant_delivered_at_idx
  ON public.quotes (tenant_id, delivered_at);
CREATE INDEX IF NOT EXISTS quotes_tenant_created_at_idx
  ON public.quotes (tenant_id, created_at);

COMMIT;
