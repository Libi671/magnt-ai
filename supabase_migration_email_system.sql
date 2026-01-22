-- Migration: Add fields for email notification system
-- Run this in Supabase SQL Editor

-- Add full_chat field to conversations table to store complete chat history
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS full_chat JSONB;

-- Add email_sent flag to leads table to prevent duplicate emails
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;

-- Add last_activity_at to leads table for tracking inactivity
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries on email_sent
CREATE INDEX IF NOT EXISTS idx_leads_email_sent ON public.leads(email_sent);
