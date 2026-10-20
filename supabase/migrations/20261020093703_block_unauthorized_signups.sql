/*
# Block sign-ups from unauthorized email addresses

1. New Tables
- `authorized_signup_emails`
  - `email` (text, primary key, stored lowercase) - an address the admin has authorized
  - `created_at` (timestamptz)

2. New Functions / Triggers
- `enforce_authorized_signup()` trigger on `auth.users` BEFORE INSERT and BEFORE UPDATE OF email:
  rejects any new account (or email change) whose address is not in `authorized_signup_emails`.

3. Security
- RLS enabled on `authorized_signup_emails` with NO policies: only the server-side user management
  function (service role) can read or write the list. App users cannot see or edit it.
- EXECUTE on the trigger function revoked from public, anon and authenticated.

4. Notes
1. Existing accounts are seeded into the list so they keep working.
2. The admin's "Utenti" page adds the email before creating the account and removes it on deletion.
*/

CREATE TABLE IF NOT EXISTS public.authorized_signup_emails (
  email text PRIMARY KEY CHECK (email = lower(email)),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.authorized_signup_emails ENABLE ROW LEVEL SECURITY;

INSERT INTO public.authorized_signup_emails (email)
SELECT lower(email) FROM auth.users WHERE email IS NOT NULL
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.enforce_authorized_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.authorized_signup_emails WHERE email = lower(NEW.email)
  ) THEN
    RAISE EXCEPTION 'Registrazione non consentita';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_authorized_signup() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_authorized_signup_insert ON auth.users;
CREATE TRIGGER enforce_authorized_signup_insert
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_authorized_signup();

DROP TRIGGER IF EXISTS enforce_authorized_signup_email_change ON auth.users;
CREATE TRIGGER enforce_authorized_signup_email_change
  BEFORE UPDATE OF email ON auth.users
  FOR EACH ROW WHEN (NEW.email IS DISTINCT FROM OLD.email)
  EXECUTE FUNCTION public.enforce_authorized_signup();
