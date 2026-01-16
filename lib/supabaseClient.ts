
import { createClient } from '@supabase/supabase-js';

// Access environment variables securely
// Note: You need to create a .env.local file with these keys
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

if (!isSupabaseConfigured) {
  console.warn('Supabase URL or Anon Key is missing. Check your .env value.');
} else {
  console.log('Supabase Client initializing with URL:', supabaseUrl);
}

// Prevent crash if variables are missing by providing fallback
// The app should check isSupabaseConfigured and show a UI warning instead of using this client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
