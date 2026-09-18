import { useState } from "react";
import { MessageSquare, Send, Bot, User } from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";

const INITIAL_MESSAGES = [];

export default function TestChat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  function handleSend() {
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      from: "user",
      text: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Test Chat</h1>

            <p className="mt-1 text-sm text-slate-500">
              Uji percakapan dengan AI secara langsung. Tes Ai kamu, jika tidak
              sesuai, perbaiki di Tugas Ai.
            </p>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center space-x-2 border-b border-slate-100 px-6 py-4">
              <MessageSquare size={18} className="text-slate-400" />

              <h2 className="text-base font-semibold text-slate-900">
                Percakapan
              </h2>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {messages.length === 0 ? (
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
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
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
            </div>

            <div className="border-t border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tulis pesan..."
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />

                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="flex items-center justify-center rounded-xl bg-blue-600 p-3 text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
