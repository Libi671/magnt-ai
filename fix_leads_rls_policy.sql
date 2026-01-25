-- Fix RLS policy for leads table
-- This ensures that anyone can create leads (for public tasks)

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Anyone can create leads" ON public.leads;

-- Create the policy again to ensure it's correct
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT 
  WITH CHECK (true);

-- Also allow updates (in case we need to update existing leads)
DROP POLICY IF EXISTS "Anyone can update leads" ON public.leads;

CREATE POLICY "Anyone can update leads" ON public.leads
  FOR UPDATE 
  USING (true)
  WITH CHECK (true);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'leads';
