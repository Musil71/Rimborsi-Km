/*
  # Add automatic user profile creation trigger

  1. Changes
    - Creates a trigger function to automatically create a user_profiles record when a new user signs up
    - Adds a trigger on auth.users to call this function after insert
    - Ensures that user_profiles is always created even if the frontend fails to create it

  2. Security
    - No RLS changes needed
    - Trigger runs with security definer privileges to ensure it can write to user_profiles
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, is_admin)
  VALUES (NEW.id, false)
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();