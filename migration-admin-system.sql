-- Migration: Administration Management & AI Logging
-- Description: Sets up admin roles, system configuration singleton, and AI token usage tracker.

-- 1. Add Role Column to Users (if not exists)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. System Settings Table (Singleton Row)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id BOOLEAN PRIMARY KEY DEFAULT TRUE,
  is_ai_enabled BOOLEAN DEFAULT TRUE,
  max_video_duration INTEGER DEFAULT 10,
  vance_prompt TEXT,
  kiki_prompt TEXT,
  oracle_prompt TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id) -- Ensures only one configuration row can ever exist
);

-- Insert the default configuration row safely
INSERT INTO public.system_settings (id, is_ai_enabled, max_video_duration)
VALUES (TRUE, TRUE, 10)
ON CONFLICT (id) DO NOTHING;

-- 3. AI Usage Logs Table
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  persona_used TEXT NOT NULL,
  tokens_consumed INTEGER NOT NULL DEFAULT 0,
  estimated_cost NUMERIC(10, 6) NOT NULL DEFAULT 0.000000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Admin Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read/write to these tables directly from the client if needed
CREATE POLICY "Admins bypass RLS for system settings" ON public.system_settings USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins bypass RLS for usage logs" ON public.ai_usage_logs USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));