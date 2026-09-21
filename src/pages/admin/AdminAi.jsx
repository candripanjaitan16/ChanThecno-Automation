import { useEffect, useState } from "react";
import { Cpu, KeyRound, Coins, Loader2, ShieldCheck } from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";
import { api } from "../../lib/api";

const PROVIDERS = [
  { id: "anthropic", label: "Claude (Anthropic)" },
  { id: "openai", label: "ChatGPT (OpenAI)" },
];

export default function AdminAi() {
  const [provider, setProvider] = useState("anthropic");
  const [model, setModel] = useState("");
  const [defaults, setDefaults] = useState({});
  const [apiKey, setApiKey] = useState("");
  const [maskedKey, setMaskedKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [credit, setCredit] = useState("1");
  const [maxTokens, setMaxTokens] = useState("500");
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  async function load() {
    const { settings } = await api("/admin/ai-settings.php");

    setProvider(settings.provider);
    setModel(settings.model || "");
    setDefaults(settings.default_models || {});
    setCredit(String(settings.credit_per_reply));
    setMaxTokens(String(settings.max_output_tokens));
    setEnabled(settings.enabled);
    setHasKey(settings.has_api_key);
    setMaskedKey(settings.api_key_masked);
    setApiKey(""); // kolom kunci selalu dikosongkan setelah dimuat/disimpan
  }

  useEffect(() => {
    load()
      .catch((err) =>
        setNotice({
          type: "error",
          text: err.message || "Gagal memuat pengaturan.",
        }),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(event) {
    event.preventDefault();
    if (saving) return;

    setNotice(null);
    setSaving(true);

    try {
      await api("/admin/ai-settings.php", {
        method: "POST",
        body: {
          provider,
          model: model.trim(),
          api_key: apiKey.trim(), // kosong = pertahankan kunci lama
          credit_per_reply: credit === "" ? 0 : Number(credit),
          max_output_tokens: Number(maxTokens),
          enabled,
        },
      });

      await load();
      setNotice({ type: "success", text: "Pengaturan AI disimpan." });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Gagal menyimpan." });
    } finally {
      setSaving(false);
    }
  }

  const noticeStyle = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
  };

  const input =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <Cpu size={22} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Pengaturan AI
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Khusus admin. Penyedia, kunci API, dan harga kredit per balasan.
              </p>
            </div>
          </div>

          {notice && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${noticeStyle[notice.type]}`}
            >
              {notice.text}
            </div>
          )}

          <form
            onSubmit={handleSave}
            className={`space-y-6 ${loading ? "pointer-events-none opacity-50" : ""}`}
          >
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Cpu size={18} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Penyedia & model
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">
                    Penyedia AI
                  </span>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className={input}
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">
                    Model (kosongkan untuk bawaan)
                  </span>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder={defaults[provider] || "nama model"}
                    maxLength={100}
                    className={input}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <KeyRound size={18} className="text-amber-500" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Kunci API
                </h2>
              </div>

              <div className="mb-3 flex items-center gap-2 text-xs">
                <ShieldCheck
                  size={14}
                  className={hasKey ? "text-emerald-500" : "text-slate-300"}
                />
                <span
                  className={hasKey ? "text-emerald-600" : "text-slate-400"}
                >
                  {hasKey
                    ? `Tersimpan (terenkripsi): ${maskedKey}`
                    : "Belum ada kunci API."}
                </span>
              </div>

              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={
                  hasKey
                    ? "Isi hanya jika ingin mengganti kunci"
                    : "Tempel kunci API"
                }
                autoComplete="off"
                className={input}
              />

              <p className="mt-2 text-xs text-slate-400">
                Kunci disimpan terenkripsi dan tidak pernah ditampilkan kembali.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Coins size={18} className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-slate-900">
                  Harga & batas
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">
                    Kredit per balasan AI
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={credit}
                    onChange={(e) => setCredit(e.target.value)}
                    className={input}
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    0 = gratis. Berlaku langsung tanpa deploy.
                  </span>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-slate-500">
                    Maks panjang balasan (token)
                  </span>
                  <input
                    type="number"
                    min="50"
                    max="2000"
                    step="1"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(e.target.value)}
                    className={input}
                  />
                  <span className="mt-1 block text-[11px] text-slate-400">
                    50 – 2000. Makin besar makin mahal untuk API-mu.
                  </span>
                </label>
              </div>

              <label className="mt-5 flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">
                  Aktifkan fitur AI untuk semua pengguna
                </span>
              </label>
            </section>

            <div className="flex justify-end pb-4">
              <button
                type="submit"
                disabled={saving || loading}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Menyimpan..." : "Simpan Pengaturan"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
