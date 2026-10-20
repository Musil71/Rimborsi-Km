/*
# Close data API privileges on the signup allow-list

1. Modified Tables
- `authorized_signup_emails`: no structural change.

2. Security changes
- Revoke ALL privileges on `public.authorized_signup_emails` from `anon` and `authenticated`.
  Row level security with no policies already denied every row; this removes the
  table-level grant as well, so the allow-list is defended at both layers.
- `service_role` keeps its privileges, which is what the server-side user management
  function uses, so creating and deleting colleague accounts is unaffected.

3. Notes
1. No application code reads or writes this table with the anon key, so nothing breaks.
2. Default privileges for future roles are left untouched.
*/

REVOKE ALL ON public.authorized_signup_emails FROM anon;
REVOKE ALL ON public.authorized_signup_emails FROM authenticated;
