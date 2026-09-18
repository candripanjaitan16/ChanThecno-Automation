import { History } from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/ui/Sidebar";

const CREDIT_TOTAL = 0;
const HISTORY = [];

export default function Dashboard() {
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

          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  Total Kredit
                </p>

                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900">
                  {CREDIT_TOTAL.toLocaleString("id-ID")}
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
              {HISTORY.length === 0 ? (
                <div className="flex min-h-[420px] items-center justify-center px-6">
                  <p className="text-sm text-slate-400">
                    Belum ada riwayat kredit.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {HISTORY.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {item.label}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {item.date}
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
