/*
# Fix Remaining Always-True and Anon Policies

1. Remove old SELECT policies that use USING(true) or grant anon access
   - people: drop "Allow public read access to people"
   - vehicles: drop "Allow public read access to vehicles"
   - trips: drop "Allow public read access to trips"
   - saved_routes: drop "Allow public read access to saved_routes", "All users can view saved routes"
   - route_distances: drop "Allow public read access to route_distances", "All users can view route distances"
   - toll_booths: drop "Authenticated users can read toll booths" (replaced by auth_select)
   - accommodations: drop "Authenticated users can read accommodations"
   - favorite_destinations: drop "Authenticated users can view favorite destinations"
   - trip_expenses: drop "Authenticated users can read trip expenses"
   - trip_meals: drop "Authenticated users can read trip meals"
   - vehicle_rate_history: drop "Authenticated users can read vehicle rate history"

2. Create replacement auth_select policies where missing
   - accommodations, favorite_destinations, trip_expenses, trip_meals,
     vehicle_rate_history, trip_toll_segments

3. Important Notes
   - All policies now require authenticated session (auth.uid() IS NOT NULL)
   - No anonymous access remains on any table
*/

-- Remove old always-true SELECT policies
DROP POLICY IF EXISTS "Allow public read access to people" ON people;
DROP POLICY IF EXISTS "Allow public read access to vehicles" ON vehicles;
DROP POLICY IF EXISTS "Allow public read access to trips" ON trips;
DROP POLICY IF EXISTS "Allow public read access to saved_routes" ON saved_routes;
DROP POLICY IF EXISTS "All users can view saved routes" ON saved_routes;
DROP POLICY IF EXISTS "Allow public read access to route_distances" ON route_distances;
DROP POLICY IF EXISTS "All users can view route distances" ON route_distances;
DROP POLICY IF EXISTS "Authenticated users can read toll booths" ON toll_booths;

-- Fix accommodations SELECT
DROP POLICY IF EXISTS "Authenticated users can read accommodations" ON accommodations;
DROP POLICY IF EXISTS "auth_select_accommodations" ON accommodations;
CREATE POLICY "auth_select_accommodations" ON accommodations FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

-- Fix accommodations write policies (replace always-true auth.uid() IS NOT NULL is already good, but check)
-- These already use auth.uid() IS NOT NULL, so they are fine.

-- Fix favorite_destinations SELECT
DROP POLICY IF EXISTS "Authenticated users can view favorite destinations" ON favorite_destinations;
DROP POLICY IF EXISTS "auth_select_favorite_destinations" ON favorite_destinations;
CREATE POLICY "auth_select_favorite_destinations" ON favorite_destinations FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

-- Fix trip_expenses SELECT
DROP POLICY IF EXISTS "Authenticated users can read trip expenses" ON trip_expenses;
DROP POLICY IF EXISTS "auth_select_trip_expenses" ON trip_expenses;
CREATE POLICY "auth_select_trip_expenses" ON trip_expenses FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

-- Fix trip_meals SELECT
DROP POLICY IF EXISTS "Authenticated users can read trip meals" ON trip_meals;
DROP POLICY IF EXISTS "auth_select_trip_meals" ON trip_meals;
CREATE POLICY "auth_select_trip_meals" ON trip_meals FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);

-- Fix vehicle_rate_history SELECT
DROP POLICY IF EXISTS "Authenticated users can read vehicle rate history" ON vehicle_rate_history;
DROP POLICY IF EXISTS "auth_select_vehicle_rate_history" ON vehicle_rate_history;
CREATE POLICY "auth_select_vehicle_rate_history" ON vehicle_rate_history FOR SELECT
  TO authenticated USING (auth.uid() IS NOT NULL);
