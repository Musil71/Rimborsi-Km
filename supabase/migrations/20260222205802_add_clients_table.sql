/*
  # Add Clients Table

  ## Summary
  Introduces a new `clients` table to represent external organizations (e.g., Villaggio SOS, Comune di Venezia)
  that ITFV staff may work for on specific trips. Clients are optional on trips — existing trips remain valid.

  ## New Tables
  - `clients`
    - `id` (uuid, primary key)
    - `name` (text, required) — organization name
    - `notes` (text, optional) — free text notes
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ## Modified Tables
  - `trips`
    - `client_id` (uuid, nullable, FK → clients) — optional link to a client

  ## Security
  - RLS enabled on `clients`
  - Authenticated users can SELECT, INSERT, UPDATE, DELETE their own organization's clients
    (since this is a single-tenant admin tool, all authenticated users share access)
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN client_id uuid REFERENCES clients(id) ON DELETE SET NULL;
  END IF;
END $$;
