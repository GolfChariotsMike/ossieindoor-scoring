import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://obtbmywqrzotvspgmaiq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idGJteXdxcnpvdHZzcGdtYWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU0NzcwMDYsImV4cCI6MjA1MTA1MzAwNn0.8tenOBgmnxwKlFt6roAT7m8OGKmIHdxnAij6seKojsY";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);