"use client";

import { useState } from "react";
import { Send } from "lucide-react";

type Msg = { role: "user" | "ai"; text: string };

export default function TestPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Msg = { role: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/test-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg.text }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "ai", text: data.reply || "(tidak ada balasan)" }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Gagal menghubungi model AI. Cek konfigurasi di Panel Admin." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-3xl flex flex-col h-[80vh]">
      <h1 className="text-2xl font-bold mb-6">Test</h1>

      <div className="flex-1 bg-panel rounded-xl border border-white/5 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <div className="text-white/30 text-sm">
            Kirim pesan untuk menguji model AI aktif (diatur di Panel Admin → Model AI).
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
              m.role === "user"
                ? "bg-purple/30 ml-auto"
                : "bg-panel2 border border-white/10"
            }`}
          >
            {m.text}
          </div>
        ))}
        {sending && <div className="text-white/30 text-sm">AI sedang mengetik...</div>}
      </div>

      <div className="flex gap-2 mt-4">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Tulis pesan test..."
          className="flex-1 bg-panel2 border border-white/10 rounded-lg px-4 py-2.5 outline-none focus:border-purple"
        />
        <button
          onClick={send}
          className="bg-purple hover:bg-purple/80 transition rounded-lg px-4 flex items-center"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
