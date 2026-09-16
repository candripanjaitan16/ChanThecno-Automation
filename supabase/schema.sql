-- ChanThecnoAutomation — schema awal Supabase
-- Jalankan di SQL editor Supabase

create extension if not exists "uuid-ossp";

-- Saldo credit per user (key = email google)
create table if not exists credits (
  id uuid primary key default uuid_generate_v4(),
  user_email text unique not null,
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Riwayat top up
create table if not exists topups (
  id uuid primary key default uuid_generate_v4(),
  user_email text not null,
  amount numeric not null,
  status text not null default 'pending', -- pending | success | failed
  created_at timestamptz not null default now()
);

-- Perintah (prompt/instruksi) yang dipakai AI
create table if not exists commands (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  content text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Larangan (kata/aturan yang tidak boleh dibalas/diproses AI)
create table if not exists restrictions (
  id uuid primary key default uuid_generate_v4(),
  keyword text not null,
  note text,
  created_at timestamptz not null default now()
);

-- Nomor WhatsApp untuk AI & nomor admin
create table if not exists wa_numbers (
  id uuid primary key default uuid_generate_v4(),
  ai_number text,
  admin_number text,
  updated_at timestamptz not null default now()
);

-- Sesi QR untuk hubungkan WhatsApp
create table if not exists qr_sessions (
  id uuid primary key default uuid_generate_v4(),
  session_name text not null,
  status text not null default 'waiting', -- waiting | connected | expired
  qr_payload text,
  created_at timestamptz not null default now()
);

-- Konfigurasi model AI — diisi BEBAS oleh admin (bukan hardcode)
create table if not exists ai_models (
  id uuid primary key default uuid_generate_v4(),
  label text not null,          -- nama tampilan, misal "Model Utama"
  provider text,                 -- bebas: openai, anthropic, custom, dll (teks bebas)
  model_id text not null,        -- bebas: gpt-4o-mini, claude-sonnet-4-6, dll
  endpoint text not null,        -- bebas: URL API
  api_key text not null,         -- disimpan terenkripsi idealnya; minimal jangan expose ke client
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

-- Hanya boleh 1 model aktif dalam satu waktu (opsional, dikelola di aplikasi)
