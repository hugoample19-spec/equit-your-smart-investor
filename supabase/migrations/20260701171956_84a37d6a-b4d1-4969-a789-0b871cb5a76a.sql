-- Revoke default PUBLIC/anon execute on SECURITY DEFINER functions and grant to authenticated only where needed.

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_friend_code() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.get_global_leaderboard_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_global_leaderboard_profiles() TO authenticated;

REVOKE ALL ON FUNCTION public.is_display_name_taken(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_display_name_taken(text, uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_leaderboard_profiles(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard_profiles(uuid[]) TO authenticated;

REVOKE ALL ON FUNCTION public.lookup_profile_by_friend_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.lookup_profile_by_friend_code(text) TO authenticated;
