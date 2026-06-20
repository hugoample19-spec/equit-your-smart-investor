
DROP POLICY IF EXISTS "translations_auth_insert" ON public.news_translations;

CREATE POLICY "translations_auth_insert"
  ON public.news_translations FOR INSERT
  TO authenticated
  WITH CHECK (
    length(content_hash) = 64
    AND content_hash ~ '^[a-f0-9]+$'
    AND lang IN ('es', 'en', 'fr', 'de', 'it', 'pt')
    AND length(translated_text) BETWEEN 1 AND 10000
  );
