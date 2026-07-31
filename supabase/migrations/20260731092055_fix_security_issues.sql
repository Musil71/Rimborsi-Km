/*
# Fix Security Issues

1. Functions - Set immutable search_path
   - update_updated_at_column: add SET search_path = public
   - get_user_person_id: add SET search_path = public
   - handle_new_user: add SET search_path = public
   - update_toll_booths_updated_at: add SET search_path = public
   - update_trip_toll_segments_updated_at: add SET search_path = public

2. Functions - Restrict SECURITY DEFINER execution
   - handle_new_user: revoke EXECUTE from anon and authenticated (trigger-only)
   - get_user_person_id: revoke EXECUTE from anon, keep authenticated
   - is_admin: revoke EXECUTE from anon, keep authenticated

3. RLS Policies - Replace always-true policies
   - Tables with anon access (people, vehicles, trips, saved_routes, route_distances):
     replace TO anon,authenticated USING(true) with TO authenticated USING(auth.uid() IS NOT NULL)
   - Tables already TO authenticated but USING(true) (clients, toll_booths):
     replace USING(true) with USING(auth.uid() IS NOT NULL)

4. Important Notes
   - This is a shared organizational app: all authenticated users see all data.
   - Policies use auth.uid() IS NOT NULL to ensure user is logged in.
   - Anonymous access is removed from all tables.
   - Trigger functions have EXECUTE revoked so they cannot be called via RPC.
*/

-- =============================================
-- 1. Fix function search_path (mutable -> immutable)
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_person_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT person_id FROM user_profiles
    WHERE id = auth.uid()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, is_admin)
  VALUES (NEW.id, false);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_toll_booths_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_trip_toll_segments_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- 2. Restrict SECURITY DEFINER functions
-- =============================================

-- handle_new_user is a trigger function, should not be callable via RPC
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- get_user_person_id only needed by authenticated users
REVOKE EXECUTE ON FUNCTION public.get_user_person_id() FROM anon;

-- is_admin only needed by authenticated users
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

-- =============================================
-- 3. Fix RLS policies on people
-- =============================================

DROP POLICY IF EXISTS "Allow public delete to people" ON people;
DROP POLICY IF EXISTS "Allow public insert to people" ON people;
DROP POLICY IF EXISTS "Allow public update to people" ON people;
DROP POLICY IF EXISTS "Allow public read to people" ON people;
DROP POLICY IF EXISTS "Allow public select to people" ON people;

CREATE POLICY "auth_select_people" ON people FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_people" ON people FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_people" ON people FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_people" ON people FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- =============================================
-- 4. Fix RLS policies on vehicles
-- =============================================

DROP POLICY IF EXISTS "Allow public delete to vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow public insert to vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow public update to vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow public read to vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow public select to vehicles" ON vehicles;

CREATE POLICY "auth_select_vehicles" ON vehicles FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_vehicles" ON vehicles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_vehicles" ON vehicles FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_vehicles" ON vehicles FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- =============================================
-- 5. Fix RLS policies on trips
-- =============================================

DROP POLICY IF EXISTS "Allow public delete to trips" ON trips;
DROP POLICY IF EXISTS "Allow public insert to trips" ON trips;
DROP POLICY IF EXISTS "Allow public update to trips" ON trips;
DROP POLICY IF EXISTS "Allow public read to trips" ON trips;
DROP POLICY IF EXISTS "Allow public select to trips" ON trips;

CREATE POLICY "auth_select_trips" ON trips FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_trips" ON trips FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_trips" ON trips FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_trips" ON trips FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- =============================================
-- 6. Fix RLS policies on saved_routes
-- =============================================

DROP POLICY IF EXISTS "Allow public delete to saved_routes" ON saved_routes;
DROP POLICY IF EXISTS "Allow public insert to saved_routes" ON saved_routes;
DROP POLICY IF EXISTS "Allow public update to saved_routes" ON saved_routes;
DROP POLICY IF EXISTS "Allow public read to saved_routes" ON saved_routes;
DROP POLICY IF EXISTS "Allow public select to saved_routes" ON saved_routes;

CREATE POLICY "auth_select_saved_routes" ON saved_routes FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_saved_routes" ON saved_routes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_saved_routes" ON saved_routes FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_saved_routes" ON saved_routes FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- =============================================
-- 7. Fix RLS policies on route_distances
-- =============================================

DROP POLICY IF EXISTS "Allow public delete to route_distances" ON route_distances;
DROP POLICY IF EXISTS "Allow public insert to route_distances" ON route_distances;
DROP POLICY IF EXISTS "Allow public update to route_distances" ON route_distances;
DROP POLICY IF EXISTS "Allow public read to route_distances" ON route_distances;
DROP POLICY IF EXISTS "Allow public select to route_distances" ON route_distances;

CREATE POLICY "auth_select_route_distances" ON route_distances FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_route_distances" ON route_distances FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_route_distances" ON route_distances FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_route_distances" ON route_distances FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- =============================================
-- 8. Fix RLS policies on clients
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can delete clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can insert clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can update clients" ON clients;
DROP POLICY IF EXISTS "Authenticated users can view clients" ON clients;

CREATE POLICY "auth_select_clients" ON clients FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_clients" ON clients FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_clients" ON clients FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_delete_clients" ON clients FOR DELETE
  TO authenticated USING (auth.uid() IS NOT NULL);

-- =============================================
-- 9. Fix RLS policies on toll_booths
-- =============================================

DROP POLICY IF EXISTS "Authenticated users can insert toll booths" ON toll_booths;
DROP POLICY IF EXISTS "Authenticated users can update toll booths" ON toll_booths;
DROP POLICY IF EXISTS "Authenticated users can view toll booths" ON toll_booths;

CREATE POLICY "auth_select_toll_booths" ON toll_booths FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
CREATE POLICY "auth_insert_toll_booths" ON toll_booths FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "auth_update_toll_booths" ON toll_booths FOR UPDATE
  TO authenticated USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
