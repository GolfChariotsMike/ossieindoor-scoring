import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = "https://obtbmywqrzotvspgmaiq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9idGJteXdxcnpvdHZzcGdtYWlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDQwMDI2MDYsImV4cCI6MjAxOTU3ODYwNn0.GQNFYqeNYkzJaKwpkBhbYeGJF0FlYg8FLzxgWKjbwXk";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  }
});