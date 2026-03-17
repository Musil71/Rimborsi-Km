/*
  # Create vehicle_rate_history table

  ## Summary
  Adds a new table to store monthly reimbursement rates (€/km) for each vehicle.
  This allows the rate to vary month by month, with fallback logic to the last
  available month if no specific rate is found for a given month.

  ## New Tables

  ### vehicle_rate_history
  - `id` (uuid, primary key)
  - `vehicle_id` (uuid, FK to vehicles, cascade delete)
  - `year` (integer) - the year the rate applies to
  - `month` (integer, 0-11) - the month (0=January, 11=December) the rate applies to
  - `rate` (numeric) - reimbursement rate in €/km for that month
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  Unique constraint on (vehicle_id, year, month) to prevent duplicate entries.

  ## Security
  - RLS enabled
  - Authenticated users can read all rates (needed for report calculations)
  - Only admins can insert/update/delete rates (via user_profiles.is_admin check)
*/

CREATE TABLE IF NOT EXISTS vehicle_rate_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  year integer NOT NULL,
  month integer NOT NULL CHECK (month >= 0 AND month <= 11),
  rate numeric(10, 4) NOT NULL CHECK (rate >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (vehicle_id, year, month)
);

ALTER TABLE vehicle_rate_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vehicle rate history"
  ON vehicle_rate_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert vehicle rate history"
  ON vehicle_rate_history FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update vehicle rate history"
  ON vehicle_rate_history FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete vehicle rate history"
  ON vehicle_rate_history FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.is_admin = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_vehicle_rate_history_vehicle_id ON vehicle_rate_history(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_rate_history_year_month ON vehicle_rate_history(year, month);
