# ChanThecnoAutomation

Dashboard AI Automation (WhatsApp) — Next.js + NextAuth (Google) + Supabase.

## Halaman yang tersedia
- `/` — Halaman Utama
- `/topup` — Topup Credit
- `/perintah` — Perintah (instruksi/prompt AI)
- `/larangan` — Larangan (kata/aturan terlarang)
- `/test` — Test chat ke model AI aktif
- `/wa-numbers` — Nomor WA untuk AI & Admin
- `/qr` — Create QR WA
- `/admin` — Panel Admin (hanya email di `ADMIN_EMAILS`)
- `/admin/models` — Konfigurasi model/API/endpoint AI secara bebas

## Setup

1. **Install dependency**
   ```bash
   npm install
   ```

2. **Isi `.env`** (copy dari `.env.example`)
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: buat di Google Cloud Console →
     OAuth consent screen + Credentials → OAuth Client ID (Web application).
     Redirect URI: `https://domain-kamu.vercel.app/api/auth/callback/google`
     (dan `http://localhost:3000/api/auth/callback/google` untuk lokal).
   - `NEXTAUTH_SECRET`: generate bebas, misal `openssl rand -base64 32`.
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` /
     `SUPABASE_SERVICE_ROLE_KEY`: dari Project Settings → API di Supabase.
   - `ADMIN_EMAILS`: email Google yang boleh akses `/admin`, pisahkan koma
     kalau lebih dari satu.

3. **Buat tabel di Supabase**
   Buka SQL Editor di Supabase, jalankan isi file `supabase/schema.sql`.

4. **Jalankan lokal**
   ```bash
   npm run dev
   ```

5. **Deploy ke Vercel**
   - Push ke GitHub, import project di Vercel.
   - Isi environment variables yang sama seperti `.env` di Project Settings → Environment Variables.
   - Update `NEXTAUTH_URL` ke domain Vercel kamu, dan update redirect URI di Google Console.

## Catatan tentang koneksi WhatsApp (QR)

Menghubungkan WhatsApp asli (misal pakai library **Baileys**) butuh koneksi
WebSocket yang hidup terus-menerus — ini **tidak bisa** jalan di Vercel
(serverless, tidak persisten). Jadi nanti perlu proses Node.js terpisah
("worker") yang:
1. Login ke WhatsApp Web via Baileys.
2. Menulis QR code & status koneksi ke tabel `qr_sessions` di Supabase yang sama.
3. Halaman `/qr` di aplikasi ini otomatis polling tabel itu dan menampilkan QR-nya.

Worker ini bisa dijalankan gratis/murah di Railway, Fly.io, atau VPS kecil.
Karena kamu bilang mau ada project admin terpisah nanti — worker WA ini cocok
digabung ke project admin tersebut di masa depan.

## Struktur project

```
app/
  page.tsx              -> Halaman Utama
  topup/                -> Topup Credit
  perintah/              -> Perintah
  larangan/              -> Larangan
  test/                  -> Test chat
  wa-numbers/            -> Nomor WA AI & Admin
  qr/                    -> Create QR WA
  admin/                 -> Panel Admin (models config, dst)
  api/
    auth/[...nextauth]/  -> Login Google
    test-chat/           -> Proxy ke model AI aktif
lib/
  auth.ts                -> Konfigurasi NextAuth
  supabase.ts             -> Client Supabase
components/
  Sidebar.tsx, AppShell.tsx, CreditCard.tsx
supabase/
  schema.sql              -> Skema database
```
