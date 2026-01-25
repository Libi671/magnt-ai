-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  phone TEXT,
  workshop_consent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migration: Add phone column to existing users table (run this if table already exists)
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS workshop_consent BOOLEAN DEFAULT false;

-- Create tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  ai_prompt TEXT NOT NULL,
  first_question TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  show_conversations BOOLEAN DEFAULT false,
  notify_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge_tasks junction table
CREATE TABLE IF NOT EXISTS public.challenge_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(challenge_id, task_id)
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE UNIQUE,
  summary TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Anyone can view public tasks" ON public.tasks
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Challenges policies
CREATE POLICY "Anyone can view public challenges" ON public.challenges
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own challenges" ON public.challenges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges" ON public.challenges
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own challenges" ON public.challenges
  FOR DELETE USING (auth.uid() = user_id);

-- Challenge_tasks policies
CREATE POLICY "Anyone can view challenge_tasks" ON public.challenge_tasks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their challenge_tasks" ON public.challenge_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.challenges
      WHERE challenges.id = challenge_id AND challenges.user_id = auth.uid()
    )
  );

-- Leads policies (everyone can create, only task owner can view)
CREATE POLICY "Anyone can create leads" ON public.leads
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Task owners can view their leads" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_id AND tasks.user_id = auth.uid()
    )
  );

-- Conversations policies
CREATE POLICY "Anyone can create/update conversations" ON public.conversations
  FOR ALL USING (true);

CREATE POLICY "Task owners can view conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.leads
      JOIN public.tasks ON tasks.id = leads.task_id
      WHERE leads.id = lead_id AND tasks.user_id = auth.uid()
    )
    OR is_public = true
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_public ON public.tasks(is_public);
CREATE INDEX IF NOT EXISTS idx_leads_task_id ON public.leads(task_id);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON public.conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_challenge_tasks_challenge_id ON public.challenge_tasks(challenge_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
