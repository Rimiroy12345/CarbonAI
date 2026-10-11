-- Apply before deploying reporting-period code. Legacy years remain unknown.
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS reporting_year integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS forecast_series_id uuid REFERENCES public.companies(id);
ALTER TABLE public.companies ADD CONSTRAINT companies_reporting_year_range CHECK (reporting_year IS NULL OR reporting_year BETWEEN 1990 AND 2100);
CREATE INDEX IF NOT EXISTS companies_forecast_history ON public.companies(user_id, forecast_series_id, reporting_year);
