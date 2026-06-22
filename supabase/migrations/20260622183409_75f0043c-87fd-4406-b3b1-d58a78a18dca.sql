CREATE TABLE public.weekly_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content jsonb NOT NULL,
  week_label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.weekly_reports TO authenticated;
GRANT ALL ON public.weekly_reports TO service_role;
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read weekly reports"
  ON public.weekly_reports FOR SELECT
  TO authenticated
  USING (true);
CREATE INDEX weekly_reports_created_at_idx ON public.weekly_reports (created_at DESC);