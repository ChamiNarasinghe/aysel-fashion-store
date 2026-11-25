-- Migration 012: automatic profile creation trigger
-- Runs AFTER INSERT ON auth.users to create a matching profiles row.
-- Uses SECURITY DEFINER so the function executes with the privileges of its
-- owner (postgres) rather than the calling role, allowing it to INSERT into
-- profiles without requiring a client-side INSERT policy.
-- A profiles INSERT RLS policy is intentionally omitted: the trigger runs
-- server-side as a privileged function and does not go through RLS.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  )
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();