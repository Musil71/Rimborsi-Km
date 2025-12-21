/*
  # Create Initial Tables for ITFV Rimborsi Chilometrici

  ## Overview
  Creates the core database schema for managing mileage reimbursements including people, vehicles, saved routes, and trips.

  ## Tables Created

  ### 1. people
  Stores information about employees/users who take trips
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Full name of the person
  - `email` (text, unique) - Email address
  - `role` (text) - Job role/position
  - `created_at` (timestamptz) - Record creation timestamp

  ### 2. vehicles
  Stores vehicle information for trip tracking
  - `id` (uuid, primary key) - Unique identifier
  - `license_plate` (text, unique) - Vehicle license plate number
  - `model` (text) - Vehicle make and model
  - `fuel_type` (text) - Type of fuel (benzina, diesel, elettrica, ibrida, gpl)
  - `consumption` (decimal) - Fuel consumption rate
  - `created_at` (timestamptz) - Record creation timestamp

  ### 3. saved_routes
  Stores frequently used routes for quick selection
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Route name/description
  - `origin` (text) - Starting location
  - `destination` (text) - Ending location
  - `distance` (decimal) - Distance in kilometers
  - `created_at` (timestamptz) - Record creation timestamp

  ### 4. trips
  Stores individual trip records with reimbursement calculations
  - `id` (uuid, primary key) - Unique identifier
  - `person_id` (uuid, foreign key) - Reference to person who took the trip
  - `vehicle_id` (uuid, foreign key) - Reference to vehicle used
  - `saved_route_id` (uuid, nullable foreign key) - Optional reference to saved route
  - `date` (date) - Date of the trip
  - `origin` (text) - Starting location
  - `destination` (text) - Ending location
  - `distance` (decimal) - Distance traveled in kilometers
  - `reimbursement_amount` (decimal) - Calculated reimbursement amount in euros
  - `notes` (text, nullable) - Additional notes about the trip
  - `created_at` (timestamptz) - Record creation timestamp

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Public access policies for authenticated users (adjust based on requirements)

  ## Important Notes
  1. All tables use UUID for primary keys
  2. All tables include created_at timestamp for auditing
  3. Foreign key constraints ensure data integrity
  4. RLS is enabled but with permissive policies (can be restricted later)
*/

-- Create people table
CREATE TABLE IF NOT EXISTS people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text UNIQUE NOT NULL,
  model text NOT NULL,
  fuel_type text NOT NULL,
  consumption decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create saved_routes table
CREATE TABLE IF NOT EXISTS saved_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  distance decimal NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create trips table
CREATE TABLE IF NOT EXISTS trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  saved_route_id uuid REFERENCES saved_routes(id) ON DELETE SET NULL,
  date date NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  distance decimal NOT NULL,
  reimbursement_amount decimal NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- Create policies for people table
CREATE POLICY "Allow public read access to people"
  ON people FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to people"
  ON people FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to people"
  ON people FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to people"
  ON people FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create policies for vehicles table
CREATE POLICY "Allow public read access to vehicles"
  ON vehicles FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to vehicles"
  ON vehicles FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to vehicles"
  ON vehicles FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to vehicles"
  ON vehicles FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create policies for saved_routes table
CREATE POLICY "Allow public read access to saved_routes"
  ON saved_routes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to saved_routes"
  ON saved_routes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to saved_routes"
  ON saved_routes FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to saved_routes"
  ON saved_routes FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create policies for trips table
CREATE POLICY "Allow public read access to trips"
  ON trips FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to trips"
  ON trips FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to trips"
  ON trips FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to trips"
  ON trips FOR DELETE
  TO anon, authenticated
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_trips_person_id ON trips(person_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_date ON trips(date);
CREATE INDEX IF NOT EXISTS idx_trips_saved_route_id ON trips(saved_route_id);