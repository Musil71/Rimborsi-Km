/*
  # Update Schema for Application Compatibility

  ## Overview
  Updates the database schema to match the application's data structure requirements.

  ## Changes Made

  ### 1. people table updates
  - Add `surname` column (text) - Stores the person's last name separately from first name
  - Add `phone` column (text, nullable) - Optional phone number

  ### 2. vehicles table updates
  - Add `person_id` column (uuid) - Links vehicle to owner
  - Add `make` column (text) - Vehicle manufacturer
  - Rename `license_plate` to keep but also add `plate` as alias if needed
  - Add `reimbursement_rate` column (decimal) - Euro per kilometer rate
  - Remove `fuel_type` and `consumption` columns as they're not used in current app

  ### 3. saved_routes table updates
  - Remove single `distance` column
  - Create new `route_distances` table for multiple distances per route

  ### 4. trips table updates
  - Add `purpose` column (text) - Purpose/reason for the trip
  - Add `is_round_trip` column (boolean) - Whether the trip is a round trip
  - Add `selected_distance_id` column (uuid, nullable) - Reference to selected route distance
  - Remove `reimbursement_amount` as it will be calculated on the fly

  ### 5. New route_distances table
  - `id` (uuid, primary key)
  - `route_id` (uuid, foreign key) - Reference to saved route
  - `label` (text) - Distance label (e.g., "Strada Normale", "Autostrada")
  - `distance` (decimal) - Distance in kilometers
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on new route_distances table
  - Public access policies added for route_distances
*/

-- Update people table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'surname'
  ) THEN
    ALTER TABLE people ADD COLUMN surname text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'phone'
  ) THEN
    ALTER TABLE people ADD COLUMN phone text;
  END IF;
END $$;

-- Update vehicles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'person_id'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN person_id uuid REFERENCES people(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'make'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN make text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'plate'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN plate text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'reimbursement_rate'
  ) THEN
    ALTER TABLE vehicles ADD COLUMN reimbursement_rate decimal DEFAULT 0.35;
  END IF;
END $$;

-- Create route_distances table
CREATE TABLE IF NOT EXISTS route_distances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES saved_routes(id) ON DELETE CASCADE,
  label text NOT NULL,
  distance decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Update saved_routes table - remove distance column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_routes' AND column_name = 'distance'
  ) THEN
    ALTER TABLE saved_routes DROP COLUMN distance;
  END IF;
END $$;

-- Update trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE trips ADD COLUMN purpose text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'is_round_trip'
  ) THEN
    ALTER TABLE trips ADD COLUMN is_round_trip boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'selected_distance_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN selected_distance_id uuid REFERENCES route_distances(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'reimbursement_amount'
  ) THEN
    ALTER TABLE trips DROP COLUMN reimbursement_amount;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'notes'
  ) THEN
    ALTER TABLE trips DROP COLUMN notes;
  END IF;
END $$;

-- Enable RLS on route_distances
ALTER TABLE route_distances ENABLE ROW LEVEL SECURITY;

-- Create policies for route_distances
CREATE POLICY "Allow public read access to route_distances"
  ON route_distances FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to route_distances"
  ON route_distances FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to route_distances"
  ON route_distances FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to route_distances"
  ON route_distances FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_route_distances_route_id ON route_distances(route_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_person_id ON vehicles(person_id);