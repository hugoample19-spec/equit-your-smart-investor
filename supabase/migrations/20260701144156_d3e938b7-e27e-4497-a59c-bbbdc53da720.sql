
-- Daily questions
CREATE TABLE public.daily_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL CHECK (correct_index >= 0 AND correct_index <= 3),
  explanation text NOT NULL,
  date date NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_questions TO authenticated;
GRANT ALL ON public.daily_questions TO service_role;
ALTER TABLE public.daily_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_questions_select_auth" ON public.daily_questions FOR SELECT TO authenticated USING (true);

-- Daily question answers
CREATE TABLE public.daily_question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_date date NOT NULL,
  is_correct boolean NOT NULL,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_date)
);
GRANT SELECT, INSERT ON public.daily_question_answers TO authenticated;
GRANT ALL ON public.daily_question_answers TO service_role;
ALTER TABLE public.daily_question_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dqa_select_own" ON public.daily_question_answers FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "dqa_insert_own" ON public.daily_question_answers FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Reset cooldown on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_reset_at timestamptz;
