/*
# Add pranzo and cena expense types

1. Modified Tables
   - `trip_expenses`
     - Updated `expense_type` CHECK constraint to accept 'pranzo' and 'cena' in addition to existing values

2. Important Notes
   - Drops and recreates the CHECK constraint (non-destructive, no data loss)
   - Existing data remains valid since all current values are still accepted
*/

ALTER TABLE trip_expenses DROP CONSTRAINT IF EXISTS trip_expenses_expense_type_check;

ALTER TABLE trip_expenses ADD CONSTRAINT trip_expenses_expense_type_check
  CHECK (expense_type = ANY (ARRAY[
    'treno'::text,
    'supplemento_treno'::text,
    'aereo'::text,
    'mezzi_pubblici'::text,
    'taxi'::text,
    'parcheggio'::text,
    'pranzo'::text,
    'cena'::text,
    'altro'::text
  ]));
