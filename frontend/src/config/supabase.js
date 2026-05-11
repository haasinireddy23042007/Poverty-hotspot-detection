import { createClient } from '@supabase/supabase-js';

// Replace 'YOUR_SUPABASE_URL' below with your actual project URL.
// Example: https://xyz.supabase.co
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL; 
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
