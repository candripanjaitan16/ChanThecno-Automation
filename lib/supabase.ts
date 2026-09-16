import { createClient } from "@supabase/supabase-js";

// Dipakai di client component / kode yang boleh terekspos ke browser
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

// Dipakai HANYA di server (route handler / server component) — bisa bypass RLS
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } }
  );
}
