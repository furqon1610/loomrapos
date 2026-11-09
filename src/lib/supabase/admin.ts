import "server-only";
import { createClient } from "@supabase/supabase-js";

// Client ini memakai secret key dan melewati RLS.
// Hanya boleh diimpor dari kode server (server action, route handler).
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  },
);
