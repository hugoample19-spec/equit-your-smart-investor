
-- Helper: generate unique 8-digit friend code
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS char(8)
LANGUAGE plpgsql
AS $$
DECLARE
  code char(8);
  exists_count int;
BEGIN
  LOOP
    code := lpad(floor(random()*100000000)::text, 8, '0');
    SELECT count(*) INTO exists_count FROM public.profiles WHERE friend_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$$;

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  username text UNIQUE,
  avatar_url text,
  friend_code char(8) UNIQUE NOT NULL,
  starting_balance numeric DEFAULT 0,
  onboarded boolean NOT NULL DEFAULT false,
  is_portfolio_public boolean NOT NULL DEFAULT true,
  favorite_referente_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_all_auth" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger: auto-create profile from auth.users on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  meta jsonb;
  uname text;
BEGIN
  meta := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  uname := lower(regexp_replace(COALESCE(meta->>'name', meta->>'full_name', split_part(NEW.email,'@',1), 'user'), '[^a-z0-9]', '', 'g'));
  IF uname = '' OR uname IS NULL THEN uname := 'user'; END IF;
  uname := uname || substr(NEW.id::text, 1, 4);

  INSERT INTO public.profiles (id, display_name, username, avatar_url, friend_code)
  VALUES (
    NEW.id,
    COALESCE(meta->>'name', meta->>'full_name', split_part(NEW.email,'@',1)),
    uname,
    COALESCE(meta->>'avatar_url', meta->>'picture'),
    public.generate_friend_code()
  );

  INSERT INTO public.notification_prefs (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- HOLDINGS
CREATE TABLE public.holdings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  name text,
  shares numeric NOT NULL DEFAULT 0,
  avg_cost numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, ticker)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.holdings TO authenticated;
GRANT ALL ON public.holdings TO service_role;
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "holdings_owner_all" ON public.holdings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "holdings_public_select" ON public.holdings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = holdings.user_id AND p.is_portfolio_public = true)
);

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker text NOT NULL,
  name text,
  type text NOT NULL CHECK (type IN ('buy','sell','deposit','withdraw')),
  shares numeric,
  price numeric,
  amount numeric NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;
GRANT ALL ON public.transactions TO service_role;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tx_owner_all" ON public.transactions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX tx_user_time_idx ON public.transactions (user_id, executed_at);

-- FRIENDSHIPS
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending','accepted','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, friend_id),
  CHECK (user_id <> friend_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fr_select_either" ON public.friendships FOR SELECT TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "fr_insert_own" ON public.friendships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fr_delete_own" ON public.friendships FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- NEWS_READS
CREATE TABLE public.news_reads (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Madrid')::date,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, read_date)
);
GRANT SELECT, INSERT, DELETE ON public.news_reads TO authenticated;
GRANT ALL ON public.news_reads TO service_role;
ALTER TABLE public.news_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nr_owner" ON public.news_reads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- LEADERBOARD SNAPSHOTS
CREATE TABLE public.leaderboard_snapshots (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Europe/Madrid')::date,
  rank int NOT NULL,
  return_pct numeric NOT NULL,
  PRIMARY KEY (user_id, snapshot_date)
);
GRANT SELECT, INSERT, UPDATE ON public.leaderboard_snapshots TO authenticated;
GRANT ALL ON public.leaderboard_snapshots TO service_role;
ALTER TABLE public.leaderboard_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lb_owner_select" ON public.leaderboard_snapshots FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- NOTIFICATION PREFS
CREATE TABLE public.notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_alerts boolean NOT NULL DEFAULT true,
  news_reminder boolean NOT NULL DEFAULT true,
  daily_summary boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_prefs TO authenticated;
GRANT ALL ON public.notification_prefs TO service_role;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "np_owner" ON public.notification_prefs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  priority int NOT NULL,
  category text NOT NULL CHECK (category IN ('friend_overtake','news_reminder','daily_summary')),
  title text NOT NULL,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_owner" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX notif_user_date_idx ON public.notifications (user_id, created_at DESC);

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
