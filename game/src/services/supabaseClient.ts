import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co';  // Your Supabase project URL
const supabaseKey = 'your-anon-key';  // Your Supabase public anon key
export const supabase = createClient(supabaseUrl, supabaseKey);
