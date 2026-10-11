ALTER TABLE public.results ADD COLUMN IF NOT EXISTS calculation_snapshot jsonb;
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS ai_snapshot jsonb;
