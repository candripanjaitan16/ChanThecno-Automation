"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

type Restriction = { id: string; keyword: string; note: string | null };

export default function LaranganPage() {
  const [items, setItems] = useState<Restriction[]>([]);
  const [keyword, setKeyword] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("restrictions")
      .select("*")
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addRestriction() {
    if (!keyword) return;
    await supabase.from("restrictions").insert({ keyword, note });
    setKeyword("");
    setNote("");
    load();
  }

  async function removeRestriction(id: string) {
    await supabase.from("restrictions").delete().eq("id", id);
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Larangan</h1>

      <div className="bg-panel rounded-xl p-6 border border-white/5 mb-6">
        <div className="font-semibold mb-4">Tambah Kata/Aturan Larangan</div>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Kata kunci yang dilarang"
          className="w-full bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 mb-3 outline-none focus:border-purple"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Catatan (opsional)"
          className="w-full bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 mb-3 outline-none focus:border-purple"
        />
        <button
          onClick={addRestriction}
          className="flex items-center gap-2 bg-purple hover:bg-purple/80 transition rounded-lg px-4 py-2 text-sm font-medium"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      <div className="space-y-2">
        {loading && <div className="text-white/30 text-sm">Memuat...</div>}
        {!loading && items.length === 0 && (
          <div className="text-white/30 text-sm">Belum ada larangan.</div>
        )}
        {items.map((r) => (
          <div
            key={r.id}
            className="bg-panel rounded-xl p-4 border border-white/5 flex justify-between items-center"
          >
            <div>
              <span className="font-medium text-red-300">{r.keyword}</span>
              {r.note && <span className="text-white/40 text-sm ml-3">{r.note}</span>}
            </div>
            <button
              onClick={() => removeRestriction(r.id)}
              className="text-white/30 hover:text-red-400 transition"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
