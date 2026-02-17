/*
  # Fix infinite recursion in user_profiles RLS policies

  ## Problem
  The existing RLS policies on user_profiles cause infinite recursion because:
  1. The "Admins can manage profiles" policy uses a subquery on user_profiles itself
  2. The is_admin() function also queries user_profiles
  3. When any policy evaluation triggers is_admin(), it re-queries user_profiles,
     which triggers the policies again, creating infinite recursion

  ## Solution
  1. Drop all existing conflicting policies on user_profiles
  2. Recreate is_admin() as SECURITY DEFINER to bypass RLS when checking admin status
  3. Create clean, non-recursive policies:
     - Users can read their own profile (using auth.uid() = id directly)
     - Users can insert their own profile on signup
     - Users can update their own profile
     - Admins can read all profiles (using SECURITY DEFINER function)
     - Admins can insert/update/delete any profile (using SECURITY DEFINER function)

  ## Security
  - SECURITY DEFINER on is_admin() means it runs with the function owner's privileges,
    bypassing RLS for that specific check - this is safe because the function only
    reads is_admin flag and cannot be exploited for data access
*/

-- Drop all existing policies on user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON user_profiles;

-- Recreate is_admin() as SECURITY DEFINER to avoid RLS recursion
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$;

-- SELECT: users can read their own profile
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- SELECT: admins can read all profiles
CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_admin());

-- INSERT: users can insert their own profile (for signup flow)
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- UPDATE: admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- DELETE: admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (is_admin());
