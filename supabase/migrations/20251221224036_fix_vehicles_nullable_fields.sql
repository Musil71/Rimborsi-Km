/*
  # Fix Vehicles Table - Make Legacy Fields Nullable
  
  ## Overview
  Updates the vehicles table to make unused legacy fields nullable or provide defaults.
  
  ## Changes Made
  
  ### 1. vehicles table updates
  - Make `fuel_type` column nullable (was required but not used by the app)
  - Make `consumption` column nullable (was required but not used by the app)
  - Make `license_plate` nullable with empty string default (app uses `plate` field instead)
  - Make `model` nullable with empty string default
  - Add default values to prevent insertion errors
  
  ## Important Notes
  1. These fields were required in the original schema but are not used by the current application
  2. The app uses `plate` and `reimbursement_rate` instead
  3. This migration ensures compatibility between database schema and application code
*/

-- Make legacy columns nullable and add defaults
DO $$
BEGIN
  -- Make fuel_type nullable with default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'fuel_type' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vehicles ALTER COLUMN fuel_type DROP NOT NULL;
    ALTER TABLE vehicles ALTER COLUMN fuel_type SET DEFAULT '';
  END IF;

  -- Make consumption nullable with default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'consumption' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vehicles ALTER COLUMN consumption DROP NOT NULL;
    ALTER TABLE vehicles ALTER COLUMN consumption SET DEFAULT 0;
  END IF;

  -- Make license_plate nullable (app uses plate instead)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'license_plate' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vehicles ALTER COLUMN license_plate DROP NOT NULL;
    ALTER TABLE vehicles ALTER COLUMN license_plate SET DEFAULT '';
  END IF;

  -- Make model nullable with default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'vehicles' AND column_name = 'model' AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE vehicles ALTER COLUMN model DROP NOT NULL;
    ALTER TABLE vehicles ALTER COLUMN model SET DEFAULT '';
  END IF;
END $$;