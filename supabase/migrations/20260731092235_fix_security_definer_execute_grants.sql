/*
# Fix SECURITY DEFINER Function Execute Grants

Revoke default EXECUTE from public role on SECURITY DEFINER functions,
then explicitly grant only to the roles that need them.

- handle_new_user: trigger-only, no role needs direct EXECUTE
- get_user_person_id: only authenticated users
- is_admin: only authenticated users
*/

-- handle_new_user: no one should call it via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- get_user_person_id: authenticated only
REVOKE EXECUTE ON FUNCTION public.get_user_person_id() FROM public;
REVOKE EXECUTE ON FUNCTION public.get_user_person_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_user_person_id() TO authenticated;

-- is_admin: authenticated only
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM public;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
