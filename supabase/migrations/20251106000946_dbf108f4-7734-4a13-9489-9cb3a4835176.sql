-- Create timer_settings table
CREATE TABLE IF NOT EXISTS public.timer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_duration_minutes integer NOT NULL DEFAULT 14,
  break_duration_seconds integer NOT NULL DEFAULT 60,
  updated_at timestamp with time zone DEFAULT now(),
  updated_by text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.timer_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read timer settings
CREATE POLICY "Anyone can read timer settings"
ON public.timer_settings
FOR SELECT
USING (true);

-- Allow authenticated users to update timer settings
CREATE POLICY "Authenticated users can update timer settings"
ON public.timer_settings
FOR UPDATE
USING (true);

-- Allow authenticated users to insert timer settings
CREATE POLICY "Authenticated users can insert timer settings"
ON public.timer_settings
FOR INSERT
WITH CHECK (true);

-- Insert default settings if none exist
INSERT INTO public.timer_settings (set_duration_minutes, break_duration_seconds)
VALUES (14, 60)
ON CONFLICT DO NOTHING;