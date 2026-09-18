import { useState } from "react";
import {
  QrCode,
  Phone,
  RefreshCw,
  Power,
  CheckCircle2,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";

export default function QrWhatsapp() {
  const [phone, setPhone] = useState("");
  const [qrGenerated, setQrGenerated] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  function handleGenerateQr() {
    if (!phone.trim()) return;

    setIsGenerating(true);
    setIsActive(false);

    setTimeout(() => {
      setIsGenerating(false);
      setQrGenerated(true);
    }, 1000);
  }

  function handleToggleActive() {
    if (!qrGenerated) return;
    setIsActive((prev) => !prev);
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <QrCode size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  QR WhatsApp
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Hubungkan WhatsApp untuk menjalankan automation AI.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Phone size={19} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Nomor WhatsApp
                  </h2>

                  <p className="text-xs text-slate-400">
                    Nomor yang akan digunakan oleh AI
                  </p>
                </div>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-600">
                    Nomor WhatsApp
                  </label>

                  <div className="relative">
                    <Phone
                      size={17}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Masukkan nomor WhatsApp yang ingin dihubungkan.
                  </p>
                </div>

                <div
                  className={`rounded-2xl border p-4 transition ${
                    isActive
                      ? "border-emerald-100 bg-emerald-50"
                      : qrGenerated
                        ? "border-amber-100 bg-amber-50"
                        : "border-slate-100 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          isActive
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-white text-slate-400"
                        }`}
                      >
                        <Power size={19} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Status Koneksi
                        </p>

                        <p
                          className={`mt-0.5 text-xs ${
                            isActive
                              ? "text-emerald-600"
                              : qrGenerated
                                ? "text-amber-600"
                                : "text-slate-400"
                          }`}
                        >
                          {isActive
                            ? "WhatsApp aktif dan terhubung"
                            : qrGenerated
                              ? "Siap untuk diaktifkan"
                              : "Belum terhubung"}
                        </p>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleActive}
                      disabled={!qrGenerated}
                      aria-label={
                        isActive
                          ? "Matikan koneksi WhatsApp"
                          : "Aktifkan koneksi WhatsApp"
                      }
                      aria-pressed={isActive}
                      className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-all duration-200 ease-in-out ${
                        isActive
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : "bg-slate-200 hover:bg-slate-300"
                      } ${
                        !qrGenerated
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      <span
                        className={`h-5 w-5 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-200 ease-in-out ${
                          isActive ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {isActive && (
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
                    <CheckCircle2 size={16} />
                    <span>WhatsApp siap digunakan untuk automation AI.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <QrCode size={19} />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    Hubungkan WhatsApp Ai
                  </h2>

                  <p className="text-xs text-slate-400">
                    Scan QR menggunakan WhatsApp
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center p-6">
                <div className="mb-5 flex w-full items-center gap-3 rounded-xl bg-blue-50 px-4 py-3">
                  <Smartphone size={18} className="shrink-0 text-blue-600" />

                  <p className="text-xs leading-relaxed text-blue-700">
                    Buka WhatsApp di HP kamu, lalu pilih perangkat tertaut dan
                    scan QR code yang muncul di bawah.
                  </p>
                </div>

                <div className="flex h-64 w-64 items-center justify-center rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
                  <div className="flex h-full w-full items-center justify-center rounded-2xl bg-white shadow-sm">
                    {isGenerating ? (
                      <div className="flex flex-col items-center gap-3">
                        <RefreshCw
                          size={30}
                          className="animate-spin text-blue-600"
                        />

                        <p className="text-sm font-medium text-slate-500">
                          Membuat QR Ai...
                        </p>
                      </div>
                    ) : qrGenerated ? (
                      <div className="flex flex-col items-center gap-3">
                        <QrCode
                          size={155}
                          strokeWidth={1.5}
                          className="text-slate-900"
                        />

                        <span className="text-[11px] font-medium text-slate-400">
                          QR WhatsApp Ai
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center px-6 text-center">
                        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <QrCode size={28} />
                        </div>

                        <p className="text-sm font-medium text-slate-500">
                          QR code belum tersedia
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Masukkan nomor WhatsApp Ai terlebih dahulu.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateQr}
                  disabled={!phone.trim() || isGenerating}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw
                    size={17}
                    className={isGenerating ? "animate-spin" : ""}
                  />

                  <span>
                    {isGenerating
                      ? "Membuat QR..."
                      : qrGenerated
                        ? "Buat QR Baru"
                        : "Buat QR Code"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 px-6 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck size={19} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-800">
                  Informasi Keamanan
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  Koneksi WhatsApp digunakan untuk menjalankan automation yang
                  kamu buat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
