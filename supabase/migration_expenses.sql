-- Migration: custos da estética (tela Custos + lucro no dashboard)
-- Execute INTEIRO no SQL Editor do Supabase ANTES do deploy do código
-- (o código novo lê public.expenses; o código antigo não usa a tabela).

BEGIN;

CREATE TABLE IF NOT EXISTS public.expenses (
  id            uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid          NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  description   text          NOT NULL CHECK (length(trim(description)) > 0),
  amount        decimal(10,2) NOT NULL CHECK (amount > 0),
  -- Só a data (sem hora): o custo nunca muda de mês por causa de fuso
  expense_date  date          NOT NULL DEFAULT current_date,
  -- Texto livre: a tela sugere uma lista padrão, mas aceita qualquer categoria
  category      text          NOT NULL DEFAULT 'Outros' CHECK (length(trim(category)) > 0),
  -- Fixo = entra no "copiar custos fixos do mês anterior"
  is_fixed      boolean       NOT NULL DEFAULT false,
  created_at    timestamptz   DEFAULT now()
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_all" ON public.expenses;
CREATE POLICY "expenses_all" ON public.expenses
  FOR ALL
  USING (tenant_id = public.get_my_tenant_id())
  WITH CHECK (tenant_id = public.get_my_tenant_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
REVOKE ALL ON public.expenses FROM anon;

CREATE INDEX IF NOT EXISTS expenses_tenant_date_idx
  ON public.expenses (tenant_id, expense_date);

COMMIT;
