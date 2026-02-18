/*
  # Make people.email nullable and remove unique constraint

  ## Changes
  - `people.email`: change from NOT NULL to nullable (email is optional)
  - Drop unique constraint on `people.email` (multiple people can have no email)

  ## Reason
  The app allows creating a person without an email address. The database
  column must accept NULL values. The unique constraint also prevents inserting
  multiple rows with no email.
*/

ALTER TABLE people ALTER COLUMN email DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'people'
      AND constraint_type = 'UNIQUE'
      AND constraint_name = 'people_email_key'
  ) THEN
    ALTER TABLE people DROP CONSTRAINT people_email_key;
  END IF;
END $$;
