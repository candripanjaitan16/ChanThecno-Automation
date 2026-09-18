import { useState } from "react";
import { History, Search } from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";

const TRANSACTIONS = [];

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "topup", label: "Top Up" },
  { id: "usage", label: "Pemakaian" },
];

export default function RiwayatTransaksi() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = TRANSACTIONS.filter((item) => {
    const matchFilter = activeFilter === "all" || item.type === activeFilter;

    const matchSearch = item.label.toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">
              Riwayat Transaksi
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Semua aktivitas top up dan pemakaian kredit kamu.
            </p>
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari transaksi..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-2">
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    activeFilter === filter.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center space-x-2 border-b border-slate-100 px-6 py-4">
              <History size={18} className="text-slate-400" />

              <h2 className="text-base font-semibold text-slate-900">
                Daftar Transaksi
              </h2>
            </div>

            <div className="min-h-[420px]">
              {filtered.length === 0 ? (
                <div className="flex min-h-[420px] items-center justify-center px-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500">
                      Belum ada transaksi.
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Riwayat top up dan pemakaian kredit akan muncul di sini.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map((item) => {
                    const isTopup = item.type === "topup";

                    return (
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
                            isTopup ? "text-emerald-600" : "text-slate-600"
                          }`}
                        >
                          {isTopup ? "+" : ""}
                          {item.amount.toLocaleString("id-ID")}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
