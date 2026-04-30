/*
  # Remove docente role from people table

  ## Summary
  Removes the is_docente column from the people table since the "Docente" role
  is no longer used. The system now only supports "Amministratore" and "Dipendente".

  ## Changes
  - Removes is_docente column from people table

  ## Notes
  - Any existing trips with trip_role = 'docente' were already handled in a previous migration
  - No data loss for amministratore/dipendente roles
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'is_docente'
  ) THEN
    ALTER TABLE people DROP COLUMN is_docente;
  END IF;
END $$;
