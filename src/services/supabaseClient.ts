import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseUrl, supabaseKey, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase';

export { supabase, supabaseUrl, supabaseKey, SUPABASE_URL, SUPABASE_ANON_KEY, createClient };
export default supabase;
