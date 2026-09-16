"use client";

import { useSession } from "next-auth/react";
import CreditCard from "@/components/CreditCard";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Halaman Utama</h1>
        <div className="text-sm text-white/50">{session?.user?.email}</div>
      </div>

      <CreditCard balance={0} />

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-panel rounded-xl p-5 border border-white/5">
          <div className="text-white/40 text-xs mb-1">Status Bot</div>
          <div className="font-semibold text-green-400">● Belum terhubung</div>
        </div>
        <div className="bg-panel rounded-xl p-5 border border-white/5">
          <div className="text-white/40 text-xs mb-1">Total Perintah Aktif</div>
          <div className="font-semibold">0</div>
        </div>
        <div className="bg-panel rounded-xl p-5 border border-white/5">
          <div className="text-white/40 text-xs mb-1">Total Larangan</div>
          <div className="font-semibold">0</div>
        </div>
      </div>

      <p className="text-white/30 text-sm mt-8">
        Data di atas masih placeholder — akan terhubung ke Supabase setelah kamu isi
        kredensial di .env dan menjalankan supabase/schema.sql.
      </p>
    </div>
  );
}
