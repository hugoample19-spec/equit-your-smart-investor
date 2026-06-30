
-- Replace overly broad SELECT policy on profiles with owner-only access
DROP POLICY IF EXISTS "profiles_select_all_auth" ON public.profiles;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Safe lookup by friend code (returns only non-sensitive public columns)
CREATE OR REPLACE FUNCTION public.lookup_profile_by_friend_code(_code text)
RETURNS TABLE (
  id uuid,
  friend_code char(8),
  display_name text,
  username text,
  avatar_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.friend_code, p.display_name, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.friend_code = _code
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_profile_by_friend_code(text) TO authenticated;

-- Check display name uniqueness without exposing other users' rows
CREATE OR REPLACE FUNCTION public.is_display_name_taken(_name text, _exclude_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE display_name ILIKE _name
      AND (_exclude_id IS NULL OR id <> _exclude_id)
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_display_name_taken(text, uuid) TO authenticated;

-- Leaderboard-safe view of profiles: wallet fields visible only when portfolio is public.
-- Never exposes stripe_customer_id.
CREATE OR REPLACE FUNCTION public.get_leaderboard_profiles(_ids uuid[])
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  friend_code char(8),
  is_portfolio_public boolean,
  is_premium boolean,
  wallet_cash numeric,
  wallet_starting numeric,
  starting_balance numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.friend_code,
    p.is_portfolio_public,
    p.is_premium,
    CASE WHEN p.is_portfolio_public OR p.id = auth.uid() THEN p.wallet_cash END,
    CASE WHEN p.is_portfolio_public OR p.id = auth.uid() THEN p.wallet_starting END,
    CASE WHEN p.is_portfolio_public OR p.id = auth.uid() THEN p.starting_balance END
  FROM public.profiles p
  WHERE p.id = ANY(_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_leaderboard_profiles(uuid[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_global_leaderboard_profiles()
RETURNS TABLE (
  id uuid,
  display_name text,
  username text,
  friend_code char(8),
  is_portfolio_public boolean,
  is_premium boolean,
  wallet_cash numeric,
  wallet_starting numeric,
  starting_balance numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.display_name,
    p.username,
    p.friend_code,
    p.is_portfolio_public,
    p.is_premium,
    p.wallet_cash,
    p.wallet_starting,
    p.starting_balance
  FROM public.profiles p
  WHERE p.is_premium = true
    AND p.is_portfolio_public = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_global_leaderboard_profiles() TO authenticated;
