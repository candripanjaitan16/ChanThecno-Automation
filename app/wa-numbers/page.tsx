"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function WaNumbersPage() {
  const [aiNumber, setAiNumber] = useState("");
  const [adminNumber, setAdminNumber] = useState("");
  const [rowId, setRowId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("wa_numbers").select("*").limit(1).single();
      if (data) {
        setRowId(data.id);
        setAiNumber(data.ai_number || "");
        setAdminNumber(data.admin_number || "");
      }
    })();
  }, []);

  async function save() {
    if (rowId) {
      await supabase
        .from("wa_numbers")
        .update({ ai_number: aiNumber, admin_number: adminNumber, updated_at: new Date().toISOString() })
        .eq("id", rowId);
    } else {
      const { data } = await supabase
        .from("wa_numbers")
        .insert({ ai_number: aiNumber, admin_number: adminNumber })
        .select()
        .single();
      if (data) setRowId(data.id);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-8">Nomor WhatsApp</h1>

      <div className="bg-panel rounded-xl p-6 border border-white/5 space-y-5">
        <div>
          <label className="text-sm text-white/40 mb-1.5 block">Nomor WA untuk AI</label>
          <input
            value={aiNumber}
            onChange={(e) => setAiNumber(e.target.value)}
            placeholder="Contoh: 628123456789"
            className="w-full bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-purple"
          />
        </div>
        <div>
          <label className="text-sm text-white/40 mb-1.5 block">Nomor Admin</label>
          <input
            value={adminNumber}
            onChange={(e) => setAdminNumber(e.target.value)}
            placeholder="Contoh: 628987654321"
            className="w-full bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-purple"
          />
        </div>
        <button
          onClick={save}
          className="bg-purple hover:bg-purple/80 transition rounded-lg px-5 py-2.5 text-sm font-medium"
        >
          {saved ? "Tersimpan ✓" : "Simpan"}
        </button>
      </div>
    </div>
  );
}
