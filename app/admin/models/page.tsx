"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

type AiModel = {
  id: string;
  label: string;
  provider: string | null;
  model_id: string;
  endpoint: string;
  api_key: string;
  is_active: boolean;
};

const empty = { label: "", provider: "", model_id: "", endpoint: "", api_key: "" };

export default function AdminModelsPage() {
  const [models, setModels] = useState<AiModel[]>([]);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from("ai_models")
      .select("*")
      .order("created_at", { ascending: false });
    setModels(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addModel() {
    if (!form.label || !form.model_id || !form.endpoint || !form.api_key) return;
    await supabase.from("ai_models").insert(form);
    setForm(empty);
    load();
  }

  async function setActive(id: string) {
    // nonaktifkan semua, aktifkan yang dipilih
    await supabase
      .from("ai_models")
      .update({ is_active: false })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("ai_models").update({ is_active: true }).eq("id", id);
    load();
  }

  async function removeModel(id: string) {
    await supabase.from("ai_models").delete().eq("id", id);
    load();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">Model AI</h1>
      <p className="text-white/40 text-sm mb-8">
        Isi bebas — provider, model, dan endpoint apa pun. Cocok untuk API
        OpenAI-compatible (OpenAI, Anthropic proxy, OpenRouter, self-hosted, dll).
      </p>

      <div className="bg-panel rounded-xl p-6 border border-white/5 mb-6 grid grid-cols-2 gap-3">
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Nama tampilan (mis. Model Utama)"
          className="bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-purple col-span-2"
        />
        <input
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
          placeholder="Provider (bebas: openai, anthropic, custom...)"
          className="bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-purple"
        />
        <input
          value={form.model_id}
          onChange={(e) => setForm({ ...form, model_id: e.target.value })}
          placeholder="Model ID (mis. gpt-4o-mini)"
          className="bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-purple"
        />
        <input
          value={form.endpoint}
          onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
          placeholder="Endpoint URL"
          className="bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-purple col-span-2"
        />
        <input
          value={form.api_key}
          onChange={(e) => setForm({ ...form, api_key: e.target.value })}
          placeholder="API Key"
          type="password"
          className="bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-purple col-span-2"
        />
        <button
          onClick={addModel}
          className="col-span-2 flex items-center justify-center gap-2 bg-purple hover:bg-purple/80 transition rounded-lg py-2.5 text-sm font-medium"
        >
          <Plus size={16} /> Tambah Model
        </button>
      </div>

      <div className="space-y-3">
        {loading && <div className="text-white/30 text-sm">Memuat...</div>}
        {!loading && models.length === 0 && (
          <div className="text-white/30 text-sm">Belum ada model tersimpan.</div>
        )}
        {models.map((m) => (
          <div
            key={m.id}
            className={`bg-panel rounded-xl p-4 border flex justify-between items-center ${
              m.is_active ? "border-purple/60" : "border-white/5"
            }`}
          >
            <div>
              <div className="font-medium flex items-center gap-2">
                {m.label}
                {m.is_active && (
                  <span className="text-xs text-purple flex items-center gap-1">
                    <CheckCircle2 size={12} /> aktif
                  </span>
                )}
              </div>
              <div className="text-white/40 text-xs mt-1">
                {m.provider || "-"} · {m.model_id}
              </div>
              <div className="text-white/30 text-xs">{m.endpoint}</div>
            </div>
            <div className="flex items-center gap-3">
              {!m.is_active && (
                <button
                  onClick={() => setActive(m.id)}
                  className="text-xs text-white/50 hover:text-white border border-white/10 rounded-lg px-3 py-1.5"
                >
                  Aktifkan
                </button>
              )}
              <button
                onClick={() => removeModel(m.id)}
                className="text-white/30 hover:text-red-400 transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
