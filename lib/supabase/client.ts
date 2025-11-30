import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  throw new Error(
    `Missing Supabase environment variables: ${missingVars.join(', ')}\n` +
      `Please check your .env.local file and ensure all required variables are set.\n` +
      `For local development, run 'supabase start' and copy the API URL and anon key.`,
  );
}

// 環境変数の形式を検証
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  throw new Error(
    `Invalid NEXT_PUBLIC_SUPABASE_URL format: ${supabaseUrl}\n` +
      `URL must start with http:// or https://`,
  );
}

if (supabaseAnonKey.length < 20) {
  console.warn(
    `Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY seems too short (${supabaseAnonKey.length} characters).\n` +
      `A valid anon key is typically much longer. Please verify your .env.local file.`,
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
