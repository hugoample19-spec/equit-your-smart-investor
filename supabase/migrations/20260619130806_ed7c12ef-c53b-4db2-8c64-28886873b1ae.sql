
CREATE OR REPLACE FUNCTION public.generate_friend_code()
RETURNS char(8)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

REVOKE EXECUTE ON FUNCTION public.generate_friend_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
