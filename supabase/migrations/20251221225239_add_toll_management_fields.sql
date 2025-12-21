/*
  # Add Toll Management Fields

  ## Overview
  Adds optional toll/highway fee fields to route_distances and trips tables to support 
  predefined toll amounts in saved routes and actual toll costs per trip.

  ## Changes Made

  ### 1. route_distances table updates
  - Add `toll_entry_station` (text, nullable) - Name of highway entry station
  - Add `toll_exit_station` (text, nullable) - Name of highway exit station  
  - Add `toll_amount` (decimal, nullable) - Predefined toll amount in euros
  
  ### 2. trips table updates
  - Add `has_toll` (boolean, default false) - Whether this trip includes toll fees
  - Add `toll_entry_station` (text, nullable) - Entry station for this specific trip
  - Add `toll_exit_station` (text, nullable) - Exit station for this specific trip
  - Add `toll_amount` (decimal, nullable) - Actual toll amount paid in euros

  ## Important Notes
  1. All toll fields are nullable/optional - trips may or may not have tolls
  2. Route distances can have predefined toll data that gets copied to trips
  3. Trip toll data is always editable regardless of route predefined values
  4. Toll amounts are stored separately from mileage reimbursement
  5. Backward compatible - existing data without tolls continues to work
*/

-- Add toll fields to route_distances table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'route_distances' AND column_name = 'toll_entry_station'
  ) THEN
    ALTER TABLE route_distances ADD COLUMN toll_entry_station text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'route_distances' AND column_name = 'toll_exit_station'
  ) THEN
    ALTER TABLE route_distances ADD COLUMN toll_exit_station text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'route_distances' AND column_name = 'toll_amount'
  ) THEN
    ALTER TABLE route_distances ADD COLUMN toll_amount decimal;
  END IF;
END $$;

-- Add toll fields to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'has_toll'
  ) THEN
    ALTER TABLE trips ADD COLUMN has_toll boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'toll_entry_station'
  ) THEN
    ALTER TABLE trips ADD COLUMN toll_entry_station text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'toll_exit_station'
  ) THEN
    ALTER TABLE trips ADD COLUMN toll_exit_station text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'toll_amount'
  ) THEN
    ALTER TABLE trips ADD COLUMN toll_amount decimal;
  END IF;
END $$;