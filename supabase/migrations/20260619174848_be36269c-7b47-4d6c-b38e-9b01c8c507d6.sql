
CREATE TABLE public.news_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  headline_hash TEXT NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  insight TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT SELECT ON public.news_insights TO authenticated;
GRANT ALL ON public.news_insights TO service_role;
ALTER TABLE public.news_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read insights"
  ON public.news_insights FOR SELECT
  TO authenticated
  USING (true);
