/*
# Administrator vs colleague access rules

1. Summary
   - Administrators see and manage everything.
   - Colleagues (accounts linked to a person) see, edit and delete only their own
     trips (with meals and toll segments), expenses and accommodations; they can view
     their own person record, vehicles and vehicle rates.
   - Shared lists (clients, favorite destinations, saved routes + distances, toll booths)
     are readable and writable by any active account (admin or linked colleague).
   - Accounts that are neither admin nor linked to a person get no access.

2. New Functions
   - `is_active_user()` - true when caller is admin or has a linked person.

3. Policy changes
   - Removed old "any signed-in user" policies on people, trips, vehicles,
     trip_expenses, accommodations, trip_meals, vehicle_rate_history.
   - Vehicles: colleagues read-only on own vehicles (rates are money; admin manages).
   - trips: colleague writes must use own person and own vehicle.
   - trip_expenses / accommodations / trip_meals: admin or owner policies.
   - Shared tables: replaced "any signed-in user" with `is_active_user()`.
   - user_profiles: users can no longer insert/update their own profile (prevents
     self-promotion to admin or linking to another person). Profiles are created
     by the existing signup trigger and managed by admins.

4. Constraints
   - Partial unique index: one account per person.
*/

CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND (is_admin = true OR person_id IS NOT NULL)
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;

-- people
DROP POLICY IF EXISTS "auth_select_people" ON people;
DROP POLICY IF EXISTS "auth_insert_people" ON people;
DROP POLICY IF EXISTS "auth_update_people" ON people;
DROP POLICY IF EXISTS "auth_delete_people" ON people;

-- trips
DROP POLICY IF EXISTS "auth_select_trips" ON trips;
DROP POLICY IF EXISTS "auth_insert_trips" ON trips;
DROP POLICY IF EXISTS "auth_update_trips" ON trips;
DROP POLICY IF EXISTS "auth_delete_trips" ON trips;
DROP POLICY IF EXISTS "Users can insert own trips" ON trips;
CREATE POLICY "Users can insert own trips" ON trips FOR INSERT TO authenticated
  WITH CHECK (
    person_id = get_user_person_id()
    AND (vehicle_id IS NULL OR EXISTS (SELECT 1 FROM vehicles v WHERE v.id = trips.vehicle_id AND v.person_id = get_user_person_id()))
  );
DROP POLICY IF EXISTS "Users can update own trips" ON trips;
CREATE POLICY "Users can update own trips" ON trips FOR UPDATE TO authenticated
  USING (person_id = get_user_person_id())
  WITH CHECK (
    person_id = get_user_person_id()
    AND (vehicle_id IS NULL OR EXISTS (SELECT 1 FROM vehicles v WHERE v.id = trips.vehicle_id AND v.person_id = get_user_person_id()))
  );

-- vehicles: colleagues read-only
DROP POLICY IF EXISTS "auth_select_vehicles" ON vehicles;
DROP POLICY IF EXISTS "auth_insert_vehicles" ON vehicles;
DROP POLICY IF EXISTS "auth_update_vehicles" ON vehicles;
DROP POLICY IF EXISTS "auth_delete_vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can insert own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can update own vehicles" ON vehicles;
DROP POLICY IF EXISTS "Users can delete own vehicles" ON vehicles;

-- vehicle_rate_history
DROP POLICY IF EXISTS "auth_select_vehicle_rate_history" ON vehicle_rate_history;
DROP POLICY IF EXISTS "select_vehicle_rate_history" ON vehicle_rate_history;
CREATE POLICY "select_vehicle_rate_history" ON vehicle_rate_history FOR SELECT TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM vehicles v WHERE v.id = vehicle_rate_history.vehicle_id AND v.person_id = get_user_person_id()));

-- trip_expenses
DROP POLICY IF EXISTS "auth_select_trip_expenses" ON trip_expenses;
DROP POLICY IF EXISTS "Authenticated users can insert trip expenses" ON trip_expenses;
DROP POLICY IF EXISTS "Authenticated users can update trip expenses" ON trip_expenses;
DROP POLICY IF EXISTS "Authenticated users can delete trip expenses" ON trip_expenses;
DROP POLICY IF EXISTS "select_trip_expenses" ON trip_expenses;
CREATE POLICY "select_trip_expenses" ON trip_expenses FOR SELECT TO authenticated
  USING (is_admin() OR person_id = get_user_person_id());
DROP POLICY IF EXISTS "insert_trip_expenses" ON trip_expenses;
CREATE POLICY "insert_trip_expenses" ON trip_expenses FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR (
    person_id = get_user_person_id()
    AND (trip_id IS NULL OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_expenses.trip_id AND t.person_id = get_user_person_id()))
  ));
DROP POLICY IF EXISTS "update_trip_expenses" ON trip_expenses;
CREATE POLICY "update_trip_expenses" ON trip_expenses FOR UPDATE TO authenticated
  USING (is_admin() OR person_id = get_user_person_id())
  WITH CHECK (is_admin() OR (
    person_id = get_user_person_id()
    AND (trip_id IS NULL OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_expenses.trip_id AND t.person_id = get_user_person_id()))
  ));
DROP POLICY IF EXISTS "delete_trip_expenses" ON trip_expenses;
CREATE POLICY "delete_trip_expenses" ON trip_expenses FOR DELETE TO authenticated
  USING (is_admin() OR person_id = get_user_person_id());

-- accommodations
DROP POLICY IF EXISTS "auth_select_accommodations" ON accommodations;
DROP POLICY IF EXISTS "Authenticated users can insert accommodations" ON accommodations;
DROP POLICY IF EXISTS "Authenticated users can update accommodations" ON accommodations;
DROP POLICY IF EXISTS "Authenticated users can delete accommodations" ON accommodations;
DROP POLICY IF EXISTS "select_accommodations" ON accommodations;
CREATE POLICY "select_accommodations" ON accommodations FOR SELECT TO authenticated
  USING (is_admin() OR person_id = get_user_person_id());
DROP POLICY IF EXISTS "insert_accommodations" ON accommodations;
CREATE POLICY "insert_accommodations" ON accommodations FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR person_id = get_user_person_id());
DROP POLICY IF EXISTS "update_accommodations" ON accommodations;
CREATE POLICY "update_accommodations" ON accommodations FOR UPDATE TO authenticated
  USING (is_admin() OR person_id = get_user_person_id())
  WITH CHECK (is_admin() OR person_id = get_user_person_id());
DROP POLICY IF EXISTS "delete_accommodations" ON accommodations;
CREATE POLICY "delete_accommodations" ON accommodations FOR DELETE TO authenticated
  USING (is_admin() OR person_id = get_user_person_id());

-- trip_meals (scoped through parent trip)
DROP POLICY IF EXISTS "auth_select_trip_meals" ON trip_meals;
DROP POLICY IF EXISTS "Authenticated users can insert trip meals" ON trip_meals;
DROP POLICY IF EXISTS "Authenticated users can update trip meals" ON trip_meals;
DROP POLICY IF EXISTS "Authenticated users can delete trip meals" ON trip_meals;
DROP POLICY IF EXISTS "select_trip_meals" ON trip_meals;
CREATE POLICY "select_trip_meals" ON trip_meals FOR SELECT TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_meals.trip_id AND t.person_id = get_user_person_id()));
DROP POLICY IF EXISTS "insert_trip_meals" ON trip_meals;
CREATE POLICY "insert_trip_meals" ON trip_meals FOR INSERT TO authenticated
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_meals.trip_id AND t.person_id = get_user_person_id()));
DROP POLICY IF EXISTS "update_trip_meals" ON trip_meals;
CREATE POLICY "update_trip_meals" ON trip_meals FOR UPDATE TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_meals.trip_id AND t.person_id = get_user_person_id()))
  WITH CHECK (is_admin() OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_meals.trip_id AND t.person_id = get_user_person_id()));
DROP POLICY IF EXISTS "delete_trip_meals" ON trip_meals;
CREATE POLICY "delete_trip_meals" ON trip_meals FOR DELETE TO authenticated
  USING (is_admin() OR EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_meals.trip_id AND t.person_id = get_user_person_id()));

-- shared tables: active accounts only
DROP POLICY IF EXISTS "auth_select_clients" ON clients;
DROP POLICY IF EXISTS "auth_insert_clients" ON clients;
DROP POLICY IF EXISTS "auth_update_clients" ON clients;
DROP POLICY IF EXISTS "auth_delete_clients" ON clients;
CREATE POLICY "auth_select_clients" ON clients FOR SELECT TO authenticated USING (is_active_user());
CREATE POLICY "auth_insert_clients" ON clients FOR INSERT TO authenticated WITH CHECK (is_active_user());
CREATE POLICY "auth_update_clients" ON clients FOR UPDATE TO authenticated USING (is_active_user()) WITH CHECK (is_active_user());
CREATE POLICY "auth_delete_clients" ON clients FOR DELETE TO authenticated USING (is_active_user());

DROP POLICY IF EXISTS "auth_select_favorite_destinations" ON favorite_destinations;
DROP POLICY IF EXISTS "Authenticated users can insert favorite destinations" ON favorite_destinations;
DROP POLICY IF EXISTS "Authenticated users can update favorite destinations" ON favorite_destinations;
DROP POLICY IF EXISTS "Authenticated users can delete favorite destinations" ON favorite_destinations;
CREATE POLICY "auth_select_favorite_destinations" ON favorite_destinations FOR SELECT TO authenticated USING (is_active_user());
CREATE POLICY "Authenticated users can insert favorite destinations" ON favorite_destinations FOR INSERT TO authenticated WITH CHECK (is_active_user());
CREATE POLICY "Authenticated users can update favorite destinations" ON favorite_destinations FOR UPDATE TO authenticated USING (is_active_user()) WITH CHECK (is_active_user());
CREATE POLICY "Authenticated users can delete favorite destinations" ON favorite_destinations FOR DELETE TO authenticated USING (is_active_user());

DROP POLICY IF EXISTS "auth_select_saved_routes" ON saved_routes;
DROP POLICY IF EXISTS "auth_insert_saved_routes" ON saved_routes;
DROP POLICY IF EXISTS "auth_update_saved_routes" ON saved_routes;
DROP POLICY IF EXISTS "auth_delete_saved_routes" ON saved_routes;
CREATE POLICY "auth_select_saved_routes" ON saved_routes FOR SELECT TO authenticated USING (is_active_user());
CREATE POLICY "auth_insert_saved_routes" ON saved_routes FOR INSERT TO authenticated WITH CHECK (is_active_user());
CREATE POLICY "auth_update_saved_routes" ON saved_routes FOR UPDATE TO authenticated USING (is_active_user()) WITH CHECK (is_active_user());
CREATE POLICY "auth_delete_saved_routes" ON saved_routes FOR DELETE TO authenticated USING (is_active_user());

DROP POLICY IF EXISTS "auth_select_route_distances" ON route_distances;
DROP POLICY IF EXISTS "auth_insert_route_distances" ON route_distances;
DROP POLICY IF EXISTS "auth_update_route_distances" ON route_distances;
DROP POLICY IF EXISTS "auth_delete_route_distances" ON route_distances;
CREATE POLICY "auth_select_route_distances" ON route_distances FOR SELECT TO authenticated USING (is_active_user());
CREATE POLICY "auth_insert_route_distances" ON route_distances FOR INSERT TO authenticated WITH CHECK (is_active_user());
CREATE POLICY "auth_update_route_distances" ON route_distances FOR UPDATE TO authenticated USING (is_active_user()) WITH CHECK (is_active_user());
CREATE POLICY "auth_delete_route_distances" ON route_distances FOR DELETE TO authenticated USING (is_active_user());

DROP POLICY IF EXISTS "auth_select_toll_booths" ON toll_booths;
DROP POLICY IF EXISTS "auth_insert_toll_booths" ON toll_booths;
DROP POLICY IF EXISTS "auth_update_toll_booths" ON toll_booths;
CREATE POLICY "auth_select_toll_booths" ON toll_booths FOR SELECT TO authenticated USING (is_active_user());
CREATE POLICY "auth_insert_toll_booths" ON toll_booths FOR INSERT TO authenticated WITH CHECK (is_active_user());
CREATE POLICY "auth_update_toll_booths" ON toll_booths FOR UPDATE TO authenticated USING (is_active_user()) WITH CHECK (is_active_user());

-- user_profiles: no self insert/update
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_person_id_unique
  ON user_profiles (person_id) WHERE person_id IS NOT NULL;
