-- Add name and email columns to leads table
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index for email
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);
