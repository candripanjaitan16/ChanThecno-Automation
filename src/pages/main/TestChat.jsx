import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Loader2,
  Trash2,
  Coins,
} from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/ui/Sidebar";
import { api } from "../../lib/api";

const MAX_LEN = 2000;

export default function TestChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null); // { text, topup }
  const [balance, setBalance] = useState(null);
  const [cost, setCost] = useState(0);
  const [enabled, setEnabled] = useState(true);

  const bottomRef = useRef(null);
  const sendingRef = useRef(false); // penjaga klik ganda (state terlambat satu render)

  const load = useCallback(async () => {
    try {
      const data = await api("/ai/chat.php");

      setMessages(
        data.messages.map((m) => ({
          id: m.id,
          from: m.role === "assistant" ? "bot" : "user",
          text: m.content,
        })),
      );
      setBalance(data.balance);
      setCost(data.cost);
      setEnabled(data.enabled);
    } catch (err) {
      setError({ text: err.message || "Gagal memuat percakapan." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Selalu gulir ke pesan terbaru
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  async function handleSend() {
    const text = input.trim();

    if (!text || sendingRef.current) return;

    sendingRef.current = true;
    setSending(true);
    setError(null);

    // Tampilkan pesan pengguna langsung (optimistis). Dibatalkan bila gagal.
    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, from: "user", text }]);
    setInput("");

    try {
      const data = await api("/ai/chat.php", {
        method: "POST",
        body: { message: text },
      });

      setMessages((prev) => [
        ...prev,
        { id: `bot-${Date.now()}`, from: "bot", text: data.reply },
      ]);
      setBalance(data.balance);
    } catch (err) {
      // Pesan gagal: tarik kembali dan kembalikan teks ke kotak ketik
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(text);

      if (err.status === 402) {
        setError({ text: err.message, topup: true });
        api("/credits/balance.php")
          .then((b) => setBalance(Number(b.balance)))
          .catch(() => {});
      } else {
        setError({ text: err.message || "Gagal mengirim pesan." });
      }
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  async function handleClear() {
    if (messages.length === 0 || sending) return;
    if (!window.confirm("Hapus seluruh riwayat percakapan tes?")) return;

    try {
      await api("/ai/chat.php", { method: "DELETE" });
      setMessages([]);
      setError(null);
    } catch (err) {
      setError({ text: err.message || "Gagal menghapus riwayat." });
    }
  }

  function handleKeyDown(e) {
    // isComposing: jangan kirim saat masih memilih kata di keyboard IME (mobile/CJK)
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  }

  const insufficient = balance !== null && cost > 0 && balance < cost;
  const disabled = !enabled || insufficient;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Test Chat</h1>

            <p className="mt-1 text-sm text-slate-500">
              Uji percakapan dengan AI secara langsung. Tes Ai kamu, jika tidak
              sesuai, perbaiki di{" "}
              <Link
                to="/tugas-ai"
                className="font-medium text-blue-600 hover:underline"
              >
                Tugas AI
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center space-x-2">
                <MessageSquare size={18} className="text-slate-400" />

                <h2 className="text-base font-semibold text-slate-900">
                  Percakapan
                </h2>
              </div>

              <div className="flex items-center gap-3">
                {balance !== null && (
                  <span
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                      insufficient
                        ? "bg-rose-50 text-rose-600"
                        : "bg-blue-50 text-blue-600"
                    }`}
                    title={
                      cost > 0 ? `${cost} kredit per balasan AI` : "Gratis"
                    }
                  >
                    <Coins size={13} />
                    {balance.toLocaleString("id-ID")} kredit
                    {cost > 0 && (
                      <span className="font-normal opacity-70">
                        · {cost}/balasan
                      </span>
                    )}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={messages.length === 0 || sending}
                  aria-label="Hapus riwayat"
                  title="Hapus riwayat"
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {loading ? (
                <div className="flex h-full min-h-[300px] items-center justify-center">
                  <Loader2 size={22} className="animate-spin text-slate-300" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full min-h-[300px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <Bot size={26} />
                    </div>

                    <p className="text-sm font-medium text-slate-600">
                      Belum ada percakapan
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Kirim pesan untuk memulai percakapan.
                    </p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isBot = msg.from === "bot";

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${
                        isBot ? "" : "flex-row-reverse"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          isBot
                            ? "bg-blue-100 text-blue-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {isBot ? <Bot size={18} /> : <User size={18} />}
                      </div>

                      <div
                        className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                          isBot
                            ? "bg-slate-100 text-slate-700"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}

              {sending && (
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Bot size={18} />
                  </div>

                  <div className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            <div className="border-t border-slate-100 p-4">
              {error && (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-700">
                  <span>{error.text}</span>

                  {error.topup && (
                    <Link
                      to="/kelola-kredit"
                      className="shrink-0 rounded-lg bg-red-600 px-3 py-1.5 font-semibold text-white hover:bg-red-700"
                    >
                      Top Up
                    </Link>
                  )}
                </div>
              )}

              {!enabled && !error && (
                <p className="mb-3 text-xs text-amber-600">
                  Fitur AI sedang dinonaktifkan oleh admin.
                </p>
              )}

              {insufficient && !error && enabled && (
                <p className="mb-3 text-xs text-rose-600">
                  Kredit tidak cukup untuk satu balasan.{" "}
                  <Link to="/kelola-kredit" className="font-semibold underline">
                    Top up sekarang
                  </Link>
                </p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_LEN}
                  disabled={disabled}
                  placeholder="Tulis pesan..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending || disabled}
                  aria-label="Kirim"
                  className="flex items-center justify-center rounded-xl bg-blue-600 p-3 text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
