import { useEffect, useState } from "react";
import { History } from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/ui/Sidebar";
import { api } from "../../lib/api";

const TYPE_LABEL = {
  bonus: "Bonus",
  topup: "Top Up",
  usage: "Pemakaian",
  refund: "Refund",
  adjustment: "Penyesuaian",
};

function formatDate(value) {
  // MySQL: "2026-09-19 01:14:09" -> Date valid di semua browser
  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [balanceData, txData] = await Promise.all([
          api("/credits/balance.php"),
          api("/credits/transactions.php?limit=20"),
        ]);

        if (cancelled) return;

        setBalance(Number(balanceData.balance));

        setHistory(
          txData.transactions.map((tx) => ({
            id: tx.id,
            label: tx.label || TYPE_LABEL[tx.type] || "Transaksi",
            type: tx.type,
            amount: Number(tx.amount),
            date: formatDate(tx.date),
          })),
        );
      } catch (err) {
        if (cancelled) return;

        if (err.status === 401) {
          // Halaman login belum ada di App.jsx, jadi sementara hanya pesan.
          // Nanti ganti dengan: navigate("/login")
          setError("Kamu belum login. Silakan login terlebih dahulu.");
        } else {
          console.error("Gagal memuat dashboard:", err);
          setError("Gagal memuat data kredit. Silakan coba lagi.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

            <p className="mt-1 text-sm text-slate-500">
              Total kredit dan riwayat kredit
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Kredit
                </p>

                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                  {loading ? (
                    <span className="inline-block h-10 w-24 animate-pulse rounded-lg bg-slate-100 align-middle" />
                  ) : (
                    balance.toLocaleString("id-ID")
                  )}
                </p>

                <p className="mt-1 text-sm text-slate-500">Kredit Tersisa</p>
              </div>

              <Link
                to="/kelola-kredit"
                className="flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
              >
                + Top Up
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <History size={18} className="text-slate-400" />

              <h2 className="text-base font-semibold text-slate-900">
                Riwayat
              </h2>
            </div>

            <div className="min-h-[420px]">
              {loading ? (
                <div className="divide-y divide-slate-100">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="space-y-2">
                        <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
                      </div>
                      <div className="h-4 w-12 animate-pulse rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="flex min-h-[420px] items-center justify-center px-6">
                  <p className="text-sm text-slate-400">
                    Belum ada riwayat kredit.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {item.label}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {TYPE_LABEL[item.type] ?? item.type} · {item.date}
                        </p>
                      </div>

                      <span
                        className={`text-sm font-semibold ${
                          item.amount > 0
                            ? "text-emerald-600"
                            : "text-slate-600"
                        }`}
                      >
                        {item.amount > 0 ? "+" : ""}
                        {item.amount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
