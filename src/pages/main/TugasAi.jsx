import { useEffect, useRef, useState } from "react";
import {
  Upload,
  Plus,
  GripVertical,
  Trash2,
  Bot,
  Phone,
  FileText,
  ShieldAlert,
  Loader2,
  X,
} from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";
import { api, API_URL } from "../../lib/api";

const MAX_TEXT = 20000;

let uid = 1;
const newProduct = (code = "") => ({
  id: uid++,
  name: "",
  description: "",
  price: "",
  stock: "",
  code,
});

const codeFor = (n) => `CP-${String(n).padStart(3, "0")}`;

/** Gabungkan isi file + ketikan tambahan dipisah satu baris kosong. */
const joinText = (fileText, typed) =>
  [fileText, typed]
    .map((t) => t.trim())
    .filter(Boolean)
    .join("\n\n");

export default function TugasAI() {
  // Teks hasil pembacaan file dan ketikan tambahan disimpan TERPISAH,
  // supaya file bisa diganti/dihapus tanpa menghilangkan ketikan.
  const [taskFile, setTaskFile] = useState({ name: "", text: "" });
  const [ruleFile, setRuleFile] = useState({ name: "", text: "" });
  const [additionalTask, setAdditionalTask] = useState("");
  const [additionalRule, setAdditionalRule] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [stopReply, setStopReply] = useState(true);
  const [products, setProducts] = useState([newProduct(codeFor(1))]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");
  const [notice, setNotice] = useState(null); // { type, text }
  const [dirty, setDirty] = useState(false);
  const loadedRef = useRef(false);

  // ---- muat data tersimpan ----
  useEffect(() => {
    let cancelled = false;

    api("/ai/config.php")
      .then(({ config }) => {
        if (cancelled) return;

        // Yang tersimpan di server adalah gabungan file + ketikan. Saat dimuat,
        // semuanya ditampilkan di kotak ketik; nama file hanya sebagai label.
        setAdditionalTask(config.task_text || "");
        setAdditionalRule(config.rule_text || "");
        setTaskFile({ name: config.task_file_name || "", text: "" });
        setRuleFile({ name: config.rule_file_name || "", text: "" });
        setWhatsappNumber(config.admin_whatsapp || "");
        setStopReply(Boolean(config.stop_reply));

        setProducts(
          config.products.length
            ? config.products.map((p) => ({
                id: uid++,
                name: p.name,
                description: p.description,
                price: String(p.price),
                stock: String(p.stock),
                code: p.code,
              }))
            : [newProduct(codeFor(1))],
        );

        loadedRef.current = true;
      })
      .catch((err) => {
        if (cancelled) return;
        setNotice({ type: "error", text: err.message || "Gagal memuat data." });
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  // ---- tandai ada perubahan yang belum disimpan ----
  const markDirty = () => {
    if (loadedRef.current) setDirty(true);
  };

  useEffect(() => {
    if (!dirty) return;

    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // ---- upload: baca teks lewat server ----
  const handleFileChange = async (event, type) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = ""; // agar file yang sama bisa dipilih ulang

    if (!file) return;

    setNotice(null);
    setUploading(type);

    try {
      const form = new FormData();
      form.append("file", file);

      const response = await fetch(`${API_URL}/ai/extract.php`, {
        method: "POST",
        credentials: "include",
        body: form, // JANGAN set Content-Type manual: browser mengisi boundary
      });

      let data = null;
      try {
        data = await response.json();
      } catch {
        // bukan JSON
      }

      if (!response.ok || !data?.success) {
        throw new Error(data?.message || "Gagal membaca file.");
      }

      if (type === "task") {
        setTaskFile({ name: data.name, text: data.text });
      } else {
        setRuleFile({ name: data.name, text: data.text });
      }

      markDirty();

      setNotice({
        type: data.truncated ? "info" : "success",
        text: data.truncated
          ? `File "${data.name}" dibaca, tetapi dipotong karena melebihi ${MAX_TEXT.toLocaleString("id-ID")} karakter.`
          : `File "${data.name}" berhasil dibaca.`,
      });
    } catch (err) {
      setNotice({ type: "error", text: err.message });
    } finally {
      setUploading("");
    }
  };

  const clearFile = (type) => {
    if (type === "task") setTaskFile({ name: "", text: "" });
    else setRuleFile({ name: "", text: "" });
    markDirty();
  };

  const addProduct = () => {
    const next = products.length + 1;
    setProducts([...products, newProduct(codeFor(next))]);
    markDirty();
  };

  const removeProduct = (id) => {
    if (products.length === 1) return;
    setProducts(products.filter((product) => product.id !== id));
    markDirty();
  };

  const updateProduct = (id, field, value) => {
    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, [field]: value } : product,
      ),
    );
    markDirty();
  };

  const moveProduct = (index, direction) => {
    const newIndex = index + direction;

    if (newIndex < 0 || newIndex >= products.length) return;

    const updated = [...products];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    setProducts(updated);
    markDirty();
  };

  // ---- simpan ----
  const taskTotal = joinText(taskFile.text, additionalTask).length;
  const ruleTotal = joinText(ruleFile.text, additionalRule).length;
  const tooLong = taskTotal > MAX_TEXT || ruleTotal > MAX_TEXT;

  const handleSave = async () => {
    if (saving || tooLong) return;

    setNotice(null);
    setSaving(true);

    try {
      const { config } = await api("/ai/config.php", {
        method: "POST",
        body: {
          task_text: joinText(taskFile.text, additionalTask),
          rule_text: joinText(ruleFile.text, additionalRule),
          task_file_name: taskFile.name,
          rule_file_name: ruleFile.name,
          admin_whatsapp: whatsappNumber.trim(),
          stop_reply: stopReply,
          products: products.map((p) => ({
            code: p.code,
            name: p.name,
            description: p.description,
            price: p.price === "" ? 0 : Number(p.price),
            stock: p.stock === "" ? 0 : Number(p.stock),
          })),
        },
      });

      // Setelah tersimpan, isi file sudah tergabung ke kotak ketik dari server
      setAdditionalTask(config.task_text || "");
      setAdditionalRule(config.rule_text || "");
      setTaskFile((f) => ({ name: f.name, text: "" }));
      setRuleFile((f) => ({ name: f.name, text: "" }));
      setDirty(false);

      setNotice({ type: "success", text: "Tugas AI berhasil disimpan." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Gagal menyimpan." });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const noticeStyle = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <Bot size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  Tugas AI
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Masukkan tugas untuk automation di WhatsApp.
                </p>
              </div>
            </div>
          </div>

          {notice && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${noticeStyle[notice.type]}`}
            >
              {notice.text}
            </div>
          )}

          {dirty && (
            <p className="mb-4 text-xs font-medium text-amber-600">
              Ada perubahan yang belum disimpan.
            </p>
          )}

          <div
            className={`space-y-6 ${loading ? "pointer-events-none opacity-50" : ""}`}
          >
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Masukkan tugas AI
                  </h2>

                  <p className="text-xs text-slate-400">
                    Kamu bisa mengatur tugas AI kamu di sini.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <UploadBox
                  file={taskFile}
                  busy={uploading === "task"}
                  onChange={(event) => handleFileChange(event, "task")}
                  onClear={() => clearFile("task")}
                />

                <div className="flex-1">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Informasi tugas
                  </p>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-700">
                      Masukkan tugas AI
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Kamu bisa mengatur AI kamu disini. Masukkan dengan bagus
                      agar AI dapat memahami tugas yang diberikan.
                    </p>
                  </div>
                </div>
              </div>

              <textarea
                value={additionalTask}
                onChange={(event) => {
                  setAdditionalTask(event.target.value);
                  markDirty();
                }}
                placeholder="Ketik tambahan"
                className="mt-4 min-h-[130px] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />

              <Counter value={taskTotal} />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-500" />

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Masukkan larangan untuk AI
                  </h2>

                  <p className="text-xs text-slate-400">
                    Atur hal-hal yang tidak boleh dilakukan oleh AI.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <UploadBox
                  file={ruleFile}
                  busy={uploading === "rule"}
                  onChange={(event) => handleFileChange(event, "rule")}
                  onClear={() => clearFile("rule")}
                />

                <div className="flex-1">
                  <p className="mb-2 text-xs font-medium text-slate-500">
                    Informasi larangan
                  </p>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <p className="text-sm font-medium text-slate-700">
                      Masukkan larangan untuk AI
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Kamu bisa membuat aturan larangan AI kamu disini. Masukkan
                      dengan bagus agar AI dapat mengikuti aturan yang
                      diberikan.
                    </p>
                  </div>
                </div>
              </div>

              <textarea
                value={additionalRule}
                onChange={(event) => {
                  setAdditionalRule(event.target.value);
                  markDirty();
                }}
                placeholder="Ketik tambahan"
                className="mt-4 min-h-[130px] w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />

              <Counter value={ruleTotal} />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Bot size={18} className="text-blue-600" />

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Produk
                    </h2>

                    <p className="text-xs text-slate-400">
                      Masukkan produk yang akan digunakan oleh AI.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="w-12 px-3 py-3 text-center text-xs font-semibold text-slate-500">
                        #
                      </th>

                      <th className="px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        ID
                      </th>

                      <th className="min-w-[150px] px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Nama
                      </th>

                      <th className="min-w-[180px] px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Deskripsi
                      </th>

                      <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Harga
                      </th>

                      <th className="w-28 px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Stok
                      </th>

                      <th className="w-32 px-3 py-3 text-left text-xs font-semibold text-slate-500">
                        Kode
                      </th>

                      <th className="w-20 px-3 py-3 text-center text-xs font-semibold text-slate-500">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {products.map((product, index) => (
                      <tr
                        key={product.id}
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveProduct(index, -1)}
                              disabled={index === 0}
                              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                            >
                              ↑
                            </button>

                            <GripVertical
                              size={16}
                              className="text-slate-300"
                            />

                            <button
                              type="button"
                              onClick={() => moveProduct(index, 1)}
                              disabled={index === products.length - 1}
                              className="rounded p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        </td>

                        <td className="px-3 py-3 text-xs font-medium text-slate-500">
                          {String(index + 1).padStart(2, "0")}
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={product.name}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "name",
                                event.target.value,
                              )
                            }
                            placeholder="Nama produk"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={product.description}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "description",
                                event.target.value,
                              )
                            }
                            placeholder="Deskripsi"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={product.price}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "price",
                                event.target.value,
                              )
                            }
                            placeholder="Rp 0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            inputMode="numeric"
                            value={product.stock}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "stock",
                                event.target.value,
                              )
                            }
                            placeholder="0"
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3">
                          <input
                            type="text"
                            value={product.code}
                            onChange={(event) =>
                              updateProduct(
                                product.id,
                                "code",
                                event.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </td>

                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeProduct(product.id)}
                            disabled={products.length === 1}
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}

                    <tr>
                      <td colSpan="8" className="px-3 py-3">
                        <button
                          type="button"
                          onClick={addProduct}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                        >
                          <Plus size={16} />
                          Tambahkan Produk
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Phone size={18} className="text-emerald-600" />

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Nomor WhatsApp Admin
                  </h2>

                  <p className="text-xs text-slate-400">
                    Nomor khusus yang digunakan AI sebagai Admin.
                  </p>
                </div>
              </div>

              <label className="mb-2 block text-xs font-medium text-slate-500">
                Nomor WhatsApp
              </label>

              <input
                type="tel"
                value={whatsappNumber}
                onChange={(event) => {
                  setWhatsappNumber(event.target.value);
                  markDirty();
                }}
                placeholder="Contoh: 6281234567890"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 md:max-w-md"
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={stopReply}
                  onChange={(event) => {
                    setStopReply(event.target.checked);
                    markDirty();
                  }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />

                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Hentikan balasan AI ketika pembeli menyetujui barang dan
                    mengirim nomor admin.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    ChanThecno Automation akan mengatur agar AI berhenti
                    membalas ketika pembeli menyetujui transaksi untuk menghemat
                    kredit. Jika belum berhasil, ChanThecno akan memberikan
                    notif <b>Wa</b>.
                  </p>
                </div>
              </label>
            </section>

            <div className="flex justify-end pb-4">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading || tooLong}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {saving ? "Menyimpan..." : "Simpan Tugas AI"}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function UploadBox({ file, busy, onChange, onClear }) {
  return (
    <div className="relative w-full md:w-40">
      <label className="flex min-h-[90px] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-center transition hover:border-blue-300 hover:bg-blue-50">
        <input
          type="file"
          accept=".txt,.md,.csv,text/plain,text/csv,text/markdown"
          className="hidden"
          onChange={onChange}
          disabled={busy}
        />

        <div className="min-w-0">
          {busy ? (
            <Loader2
              size={22}
              className="mx-auto mb-2 animate-spin text-blue-500"
            />
          ) : (
            <Upload size={22} className="mx-auto mb-2 text-slate-400" />
          )}

          <p className="truncate text-xs font-medium text-slate-600">
            {busy ? "Membaca..." : file.name || "Upload file"}
          </p>

          {!file.name && !busy && (
            <p className="mt-1 text-[10px] text-slate-400">
              .txt / .md / .csv, maks 512 KB
            </p>
          )}
        </div>
      </label>

      {file.name && !busy && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Hapus file"
          className="absolute right-1.5 top-1.5 rounded-full bg-white p-1 text-slate-400 shadow transition hover:text-rose-500"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

function Counter({ value }) {
  const over = value > MAX_TEXT;

  return (
    <p
      className={`mt-1.5 text-right text-[11px] ${
        over ? "font-semibold text-rose-500" : "text-slate-400"
      }`}
    >
      {value.toLocaleString("id-ID")} / {MAX_TEXT.toLocaleString("id-ID")}{" "}
      karakter
      {over && " — terlalu panjang, kurangi sebelum menyimpan"}
    </p>
  );
}
