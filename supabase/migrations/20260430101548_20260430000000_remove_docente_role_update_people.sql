/*
  # Rimozione ruolo Docente e aggiornamento persone

  ## Modifiche

  ### 1. people table
  - Aggiunge colonne is_docente, is_amministratore, is_dipendente (se non esistono)
  - Imposta is_amministratore = true per tutte le persone esistenti
  - Imposta is_dipendente = true (e is_amministratore = false) solo per Piovesan

  ### 2. trips table
  - Aggiunge colonna trip_role (se non esiste)
  - Elimina tutte le trasferte con trip_role = 'docente'

  ## Note
  - Il ruolo Docente viene rimosso dall'applicazione
  - Tutte le persone vengono impostate come Amministratore per default
  - Piovesan è l'unica Dipendente
*/

-- Aggiungi colonne ruolo a people se non esistono
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'is_docente'
  ) THEN
    ALTER TABLE people ADD COLUMN is_docente boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'is_amministratore'
  ) THEN
    ALTER TABLE people ADD COLUMN is_amministratore boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'people' AND column_name = 'is_dipendente'
  ) THEN
    ALTER TABLE people ADD COLUMN is_dipendente boolean DEFAULT false;
  END IF;
END $$;

-- Aggiungi colonna trip_role a trips se non esiste
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'trip_role'
  ) THEN
    ALTER TABLE trips ADD COLUMN trip_role text;
  END IF;
END $$;

-- Imposta tutte le persone come Amministratore
UPDATE people
SET is_amministratore = true,
    is_docente = false,
    is_dipendente = false;

-- Piovesan è Dipendente (non Amministratore)
UPDATE people
SET is_dipendente = true,
    is_amministratore = false,
    is_docente = false
WHERE LOWER(surname) = 'piovesan';

-- Elimina trasferte con ruolo docente
DELETE FROM trips WHERE trip_role = 'docente';

-- Aggiorna trasferte esistenti senza ruolo: assegna il ruolo corretto dalla persona
UPDATE trips t
SET trip_role = 'amministratore'
WHERE t.trip_role IS NULL
  AND EXISTS (
    SELECT 1 FROM people p
    WHERE p.id = t.person_id AND p.is_amministratore = true
  );

UPDATE trips t
SET trip_role = 'dipendente'
WHERE t.trip_role IS NULL
  AND EXISTS (
    SELECT 1 FROM people p
    WHERE p.id = t.person_id AND p.is_dipendente = true
  );
