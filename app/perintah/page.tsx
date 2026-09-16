"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2 } from "lucide-react";

type Command = {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
};

export default function PerintahPage() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("commands")
      .select("*")
      .order("created_at", { ascending: false });
    setCommands(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addCommand() {
    if (!title || !content) return;
    await supabase.from("commands").insert({ title, content });
    setTitle("");
    setContent("");
    load();
  }

  async function removeCommand(id: string) {
    await supabase.from("commands").delete().eq("id", id);
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Perintah</h1>

      <div className="bg-panel rounded-xl p-6 border border-white/5 mb-6">
        <div className="font-semibold mb-4">Tambah Perintah Baru</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Judul perintah"
          className="w-full bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 mb-3 outline-none focus:border-purple"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Isi instruksi/prompt untuk AI..."
          rows={4}
          className="w-full bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 mb-3 outline-none focus:border-purple resize-none"
        />
        <button
          onClick={addCommand}
          className="flex items-center gap-2 bg-purple hover:bg-purple/80 transition rounded-lg px-4 py-2 text-sm font-medium"
        >
          <Plus size={16} /> Tambah
        </button>
      </div>

      <div className="space-y-3">
        {loading && <div className="text-white/30 text-sm">Memuat...</div>}
        {!loading && commands.length === 0 && (
          <div className="text-white/30 text-sm">Belum ada perintah.</div>
        )}
        {commands.map((c) => (
          <div
            key={c.id}
            className="bg-panel rounded-xl p-4 border border-white/5 flex justify-between items-start"
          >
            <div>
              <div className="font-medium">{c.title}</div>
              <div className="text-white/40 text-sm mt-1 whitespace-pre-wrap">
                {c.content}
              </div>
            </div>
            <button
              onClick={() => removeCommand(c.id)}
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
