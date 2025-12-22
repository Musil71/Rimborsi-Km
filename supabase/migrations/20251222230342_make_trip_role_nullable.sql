/*
  # Make trip_role field nullable

  ## Overview
  Updates the trips table to make trip_role nullable for backward compatibility.

  ## Changes Made

  ### 1. Modify trips table
  - Make `trip_role` column nullable to allow existing trips without role assignment
  - Set default value to 'docente' for new trips

  ## Important Notes
  1. Existing trips without a role will have NULL value
  2. New trips should have role explicitly set when created
*/

-- Make trip_role nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'trip_role'
  ) THEN
    ALTER TABLE trips ALTER COLUMN trip_role DROP NOT NULL;
    ALTER TABLE trips ALTER COLUMN trip_role SET DEFAULT 'docente';
  END IF;
END $$;