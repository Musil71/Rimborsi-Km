/*
  # Add return toll fields and trip-linked expenses

  ## Changes

  ### trips table
  - `return_toll_entry_station` (text, nullable) - entry toll station for the return leg of an A/R trip
  - `return_toll_exit_station` (text, nullable) - exit toll station for the return leg of an A/R trip  
  - `return_toll_amount` (numeric, nullable) - toll amount for the return leg

  ### trip_expenses table
  - `trip_id` (uuid, nullable, FK → trips) - links an expense directly to a specific trip
    When null, the expense is a standalone record (existing behaviour).

  ## Notes
  - All new columns are nullable to preserve backward compatibility
  - The FK on trip_id uses ON DELETE CASCADE so expenses are cleaned up when a trip is deleted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'return_toll_entry_station'
  ) THEN
    ALTER TABLE trips ADD COLUMN return_toll_entry_station text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'return_toll_exit_station'
  ) THEN
    ALTER TABLE trips ADD COLUMN return_toll_exit_station text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'return_toll_amount'
  ) THEN
    ALTER TABLE trips ADD COLUMN return_toll_amount numeric;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trip_expenses' AND column_name = 'trip_id'
  ) THEN
    ALTER TABLE trip_expenses ADD COLUMN trip_id uuid REFERENCES trips(id) ON DELETE CASCADE;
  END IF;
END $$;
