/*
  # Destinazioni Abituali

  1. Nuove Tabelle
    - `favorite_destinations`
      - `id` (uuid, primary key)
      - `name` (text) - Nome breve della destinazione (es. "Servizi Sociali Chioggia")
      - `address` (text) - Indirizzo completo
      - `default_distance` (decimal) - Distanza predefinita in km dalla sede principale
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Sicurezza
    - RLS abilitata
    - Tutti gli utenti autenticati possono leggere le destinazioni
    - Tutti gli utenti autenticati possono creare, modificare ed eliminare destinazioni

  3. Dati iniziali
    - Inserimento delle 6 destinazioni abituali fornite
*/

CREATE TABLE IF NOT EXISTS favorite_destinations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text NOT NULL,
  default_distance decimal(10,1) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE favorite_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view favorite destinations"
  ON favorite_destinations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert favorite destinations"
  ON favorite_destinations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update favorite destinations"
  ON favorite_destinations FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete favorite destinations"
  ON favorite_destinations FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

INSERT INTO favorite_destinations (name, address, default_distance) VALUES
  ('Servizi Sociali Chioggia', 'Corso del Popolo, 1193, 30015 Chioggia', 75),
  ('Hotel Galileo', 'Via Venezia, 30, 35131 Padova PD', 52),
  ('Centro Soranzo', 'Via Pezzana, 1, 30173 Tessera, Venezia VE', 32),
  ('Co.ge.s.', 'V.le S. Marco, 172, 30173 Venezia VE', 33),
  ('Coges Bricola', 'Via Paliaga, 4/8, 30173 Venezia VE', 35),
  ('SOS Villaggi dei Bambini Vicenza', 'Viale Trieste, 166, 36100 Vicenza VI', 85);
