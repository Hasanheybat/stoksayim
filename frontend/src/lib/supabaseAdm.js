import { createClient } from '@supabase/supabase-js';

const supabaseUrl    = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Admin paneli için AYRI Supabase client — farklı localStorage key
// Böylece app ve admin oturumları birbirini silmez
export const supabaseAdm = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: 'sb-adm-token' }
});
