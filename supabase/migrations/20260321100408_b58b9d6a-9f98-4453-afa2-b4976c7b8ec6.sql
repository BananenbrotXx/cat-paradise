-- Allow anyone to check if a user is banned (just user_ids, no sensitive data)
CREATE OR REPLACE FUNCTION public.get_banned_user_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.banned_users
$$;

-- Function to auto-clean banned users from leaderboard after 24h
CREATE OR REPLACE FUNCTION public.cleanup_banned_leaderboard()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.leaderboard
  WHERE user_id IN (
    SELECT user_id FROM public.banned_users
    WHERE created_at < now() - interval '24 hours'
  );
END;
$$;