-- Migration: veículos por cliente (1 cliente → N veículos)
-- Execute INTEIRO no SQL Editor do Supabase antes de fazer deploy:
-- supabase.com/dashboard/project/pxsvsikmmoskzdmkwtns/sql/new

-- 1. Tabela vehicles
CREATE TABLE public.vehicles (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid         NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id    uuid         NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plate        text         NOT NULL,
  brand        text,
  brand_code   text,
  model        text,
  model_code   text,
  year         text,
  created_at   timestamptz  DEFAULT now()
);

-- 2. RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vehicles_all" ON public.vehicles
  FOR ALL USING (tenant_id = public.get_my_tenant_id());

-- 3. Migrar: criar um veículo por cliente existente (plate + car_model → vehicles)
INSERT INTO public.vehicles (tenant_id, client_id, plate, model)
SELECT tenant_id, id, plate, car_model
FROM public.clients
WHERE plate IS NOT NULL AND plate <> '';

-- 4. Adicionar vehicle_id em quotes (nullable para compat. com orçamentos antigos)
ALTER TABLE public.quotes
  ADD COLUMN vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL;

-- 5. Preencher vehicle_id nos orçamentos existentes (via client_id)
UPDATE public.quotes q
SET vehicle_id = v.id
FROM public.vehicles v
WHERE v.client_id = q.client_id;

-- 6. Remover colunas antigas de clients
ALTER TABLE public.clients DROP COLUMN plate;
ALTER TABLE public.clients DROP COLUMN car_model;
