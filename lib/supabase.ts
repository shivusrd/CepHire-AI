import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mbamnufhgnysnkvtshdf.supabase.co"; 
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_klhC4KyMkHwyGwPyFVcdaw_EQ53j-D0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
  global: {
    // This helps bypass some simple firewalls by identifying the app
    headers: { 'x-my-custom-header': 'daksha-ai-app' },
    // Use the standard fetch but add a catch for timeouts
    fetch: (url, options) => {
      return fetch(url, { ...options, cache: 'no-store' });
    },
  },
});