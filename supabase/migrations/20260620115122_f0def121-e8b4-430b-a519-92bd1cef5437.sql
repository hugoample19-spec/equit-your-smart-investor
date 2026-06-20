
CREATE TABLE public.news_translations (
  content_hash TEXT NOT NULL,
  lang TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (content_hash, lang)
);

GRANT SELECT, INSERT ON public.news_translations TO authenticated;
GRANT SELECT ON public.news_translations TO anon;
GRANT ALL ON public.news_translations TO service_role;

ALTER TABLE public.news_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "translations_public_read"
  ON public.news_translations FOR SELECT
  USING (true);

CREATE POLICY "translations_auth_insert"
  ON public.news_translations FOR INSERT
  TO authenticated
  WITH CHECK (true);
