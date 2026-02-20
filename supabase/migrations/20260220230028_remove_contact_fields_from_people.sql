/*
  # Remove contact fields from people table

  ## Changes
  - Remove `email` column from `people` table
  - Remove `phone` column from `people` table
  - Remove `home_address` column from `people` table

  ## Reason
  These fields are not relevant for the application's purpose of tracking
  travel reimbursements. They add unnecessary data collection.
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'email'
  ) THEN
    ALTER TABLE people DROP COLUMN email;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'phone'
  ) THEN
    ALTER TABLE people DROP COLUMN phone;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'home_address'
  ) THEN
    ALTER TABLE people DROP COLUMN home_address;
  END IF;
END $$;
