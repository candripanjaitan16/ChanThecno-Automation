import { createClient } from "@supabase/supabase-js";

// Fallback dipakai HANYA supaya proses build tidak crash saat env var belum
// diisi (mis. deploy pertama sebelum Environment Variables di-set di Vercel).
// Setelah env var asli diisi & redeploy, fallback ini otomatis tidak terpakai.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Dipakai di client component / kode yang boleh terekspos ke browser
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Dipakai HANYA di server (route handler / server component) — bisa bypass RLS
export function supabaseAdmin() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-role-key",
    { auth: { persistSession: false } }
  );
}