-- Fix the 406 error on ecoregions table
-- This is caused by missing or incorrect RLS policies

-- Check if ecoregions table exists and has RLS
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'ecoregions';

-- Enable RLS and create policy
ALTER TABLE public.ecoregions ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any
DROP POLICY IF EXISTS "Ecoregions are viewable by everyone" ON public.ecoregions;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.ecoregions;

-- Create new policy
CREATE POLICY "Enable read access for all users"
  ON public.ecoregions
  FOR SELECT
  USING (true);

-- Verify policy was created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'ecoregions';
