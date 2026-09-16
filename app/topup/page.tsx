"use client";

import { useState } from "react";
import CreditCard from "@/components/CreditCard";

const amounts = [5, 10, 20, 50, 100, 500];

export default function TopupPage() {
  const [selected, setSelected] = useState<number | null>(null);
  const [custom, setCustom] = useState("");

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-8">Topup Credit</h1>

      <CreditCard balance={0} />

      <div className="bg-panel rounded-xl p-6 border border-white/5 mt-6">
        <div className="font-semibold mb-4">Pilih Jumlah</div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {amounts.map((a) => (
            <button
              key={a}
              onClick={() => {
                setSelected(a);
                setCustom("");
              }}
              className={`rounded-lg py-3 text-sm font-medium border transition ${
                selected === a
                  ? "bg-purple/30 border-purple text-white"
                  : "bg-panel2 border-white/10 text-white/70 hover:border-white/30"
              }`}
            >
              ${a.toFixed(2)}
            </button>
          ))}
        </div>

        <div className="text-sm text-white/40 mb-2">Jumlah Kustom</div>
        <input
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            setSelected(null);
          }}
          placeholder="$ --"
          className="w-full bg-panel2 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-purple"
        />

        <button
          disabled={!selected && !custom}
          className="w-full mt-5 bg-purple disabled:opacity-30 disabled:cursor-not-allowed hover:bg-purple/80 transition rounded-lg py-3 font-medium"
        >
          Lanjutkan Pembayaran
        </button>

        <p className="text-white/30 text-xs mt-4">
          Proses pembayaran belum terhubung ke payment gateway — sambungkan Midtrans/
          Xendit/dll di sini nanti, lalu update tabel `topups` &amp; `credits` di Supabase.
        </p>
      </div>
    </div>
  );
}
