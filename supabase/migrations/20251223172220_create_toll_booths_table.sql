/*
  # Create Toll Booths Table for Recurring Toll Management

  1. New Tables
    - `toll_booths`
      - `id` (uuid, primary key)
      - `entry_station` (text, not null) - Name of entry toll booth
      - `exit_station` (text, not null) - Name of exit toll booth
      - `amount` (numeric, not null) - Current toll amount in euros
      - `usage_count` (integer, default 0) - Number of times this combination has been used
      - `last_used` (timestamptz) - Last time this toll booth combination was used
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Indexes
    - Unique constraint on (LOWER(entry_station), LOWER(exit_station)) to prevent duplicates
    - Index on entry_station for autocomplete queries
    - Index on exit_station for autocomplete queries
    - Index on usage_count for sorting by popularity

  3. Security
    - Enable RLS on `toll_booths` table
    - Add policies for authenticated users to read all toll booths
    - Add policies for authenticated users to insert and update toll booths

  4. Notes
    - A → B and B → A are treated as separate entries (bidirectional)
    - Amount can be updated dynamically when users save trips with different amounts
    - Usage count increments each time a trip uses this toll booth combination
*/

-- Create toll_booths table
CREATE TABLE IF NOT EXISTS toll_booths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_station text NOT NULL,
  exit_station text NOT NULL,
  amount numeric(10, 2) NOT NULL CHECK (amount >= 0),
  usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
  last_used timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint on case-insensitive combination of entry and exit stations
CREATE UNIQUE INDEX IF NOT EXISTS toll_booths_stations_unique 
  ON toll_booths (LOWER(entry_station), LOWER(exit_station));

-- Create indexes for autocomplete performance
CREATE INDEX IF NOT EXISTS toll_booths_entry_station_idx 
  ON toll_booths (entry_station);

CREATE INDEX IF NOT EXISTS toll_booths_exit_station_idx 
  ON toll_booths (exit_station);

CREATE INDEX IF NOT EXISTS toll_booths_usage_count_idx 
  ON toll_booths (usage_count DESC);

-- Enable Row Level Security
ALTER TABLE toll_booths ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all toll booths
CREATE POLICY "Authenticated users can read toll booths"
  ON toll_booths
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert toll booths
CREATE POLICY "Authenticated users can insert toll booths"
  ON toll_booths
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update toll booths
CREATE POLICY "Authenticated users can update toll booths"
  ON toll_booths
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_toll_booths_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS toll_booths_updated_at_trigger ON toll_booths;
CREATE TRIGGER toll_booths_updated_at_trigger
  BEFORE UPDATE ON toll_booths
  FOR EACH ROW
  EXECUTE FUNCTION update_toll_booths_updated_at();