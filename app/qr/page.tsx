"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
import { RefreshCw } from "lucide-react";

export default function QrPage() {
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [status, setStatus] = useState("waiting");
  const [sessionId, setSessionId] = useState<string | null>(null);

  async function createSession() {
    setStatus("waiting");
    setQrImage(null);
    const { data } = await supabase
      .from("qr_sessions")
      .insert({ session_name: `session-${Date.now()}`, status: "waiting" })
      .select()
      .single();
    if (data) setSessionId(data.id);
  }

  useEffect(() => {
    createSession();
  }, []);

  // Poll tabel qr_sessions — worker WA (Baileys) di server terpisah
  // yang akan menulis qr_payload & status ke sini.
  useEffect(() => {
    if (!sessionId) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("qr_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      if (data?.qr_payload) {
        const img = await QRCode.toDataURL(data.qr_payload);
        setQrImage(img);
      }
      if (data?.status) setStatus(data.status);
    }, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-8">Create QR WA</h1>

      <div className="bg-panel rounded-xl p-8 border border-white/5 flex flex-col items-center">
        <div className="w-56 h-56 bg-white rounded-lg flex items-center justify-center overflow-hidden">
          {qrImage ? (
            <img src={qrImage} alt="QR WhatsApp" className="w-full h-full" />
          ) : (
            <span className="text-black/40 text-sm px-4 text-center">
              Menunggu QR dari worker WhatsApp...
            </span>
          )}
        </div>

        <div className="mt-4 text-sm text-white/50">
          Status:{" "}
          <span
            className={
              status === "connected" ? "text-green-400" : "text-yellow-400"
            }
          >
            {status}
          </span>
        </div>

        <button
          onClick={createSession}
          className="mt-5 flex items-center gap-2 text-sm text-white/50 hover:text-white transition"
        >
          <RefreshCw size={14} /> Buat sesi baru
        </button>
      </div>

      <div className="text-white/30 text-xs mt-6 leading-relaxed">
        Catatan penting: menghubungkan WhatsApp asli (via Baileys/WhatsApp Web) butuh proses
        Node.js yang hidup terus-menerus — ini <b>tidak bisa</b> berjalan di Vercel serverless
        karena butuh koneksi WebSocket yang persisten. Halaman ini hanya menampilkan QR yang
        ditulis ke tabel <code>qr_sessions</code> oleh worker terpisah. Worker itu bisa kamu
        jalankan gratis di Railway/Fly.io/VPS kecil, terhubung ke Supabase yang sama.
      </div>
    </div>
  );
}
