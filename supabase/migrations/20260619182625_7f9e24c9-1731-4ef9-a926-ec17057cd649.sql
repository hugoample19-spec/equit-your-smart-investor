CREATE TABLE public.price_cache (
  ticker TEXT PRIMARY KEY,
  price NUMERIC NOT NULL,
  prev_close NUMERIC,
  change_pct NUMERIC,
  source TEXT,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.price_cache TO anon, authenticated;
GRANT ALL ON public.price_cache TO service_role;

ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "price_cache readable by everyone"
ON public.price_cache FOR SELECT
USING (true);