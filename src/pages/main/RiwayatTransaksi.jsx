import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, History, Search } from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";
import { api } from "../../lib/api";

const PAGE_SIZE = 15;

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "topup", label: "Top Up" },
  { id: "usage", label: "Pemakaian" },
];

const TYPE_LABEL = {
  bonus: "Bonus",
  topup: "Top Up",
  usage: "Pemakaian",
  refund: "Refund",
  adjustment: "Penyesuaian",
};

function formatDate(value) {
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

/** Tunda nilai sampai pengguna berhenti mengetik. */
function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function RiwayatTransaksi() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const debouncedSearch = useDebounced(search.trim());

  // Ganti filter / kata kunci -> kembali ke halaman 1
  useEffect(() => {
    setPage(1);
  }, [activeFilter, debouncedSearch]);

  useEffect(() => {
    // "cancelled" mencegah respons lama menimpa respons baru
    // (mis. mengetik cepat, atau pindah halaman cepat).
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          type: activeFilter,
        });

        if (debouncedSearch) params.set("q", debouncedSearch);

        const data = await api(`/credits/transactions.php?${params}`);

        if (cancelled) return;

        setItems(data.transactions);
        setPagination(data.pagination);

        // Server menjepit halaman bila melebihi total
        if (data.pagination.page !== page) setPage(data.pagination.page);
      } catch (err) {
        if (cancelled) return;
        console.error("Gagal memuat riwayat:", err);
        setError("Gagal memuat riwayat transaksi. Silakan coba lagi.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [page, activeFilter, debouncedSearch]);

  const isFiltering = activeFilter !== "all" || debouncedSearch !== "";
  const from = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, pagination.total);

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
                maxLength={100}
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

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center space-x-2">
                <History size={18} className="text-slate-400" />

                <h2 className="text-base font-semibold text-slate-900">
                  Daftar Transaksi
                </h2>
              </div>

              {!loading && pagination.total > 0 && (
                <span className="text-xs text-slate-400">
                  {pagination.total.toLocaleString("id-ID")} transaksi
                </span>
              )}
            </div>

            <div className="min-h-[420px]">
              {loading && items.length === 0 ? (
                <div className="divide-y divide-slate-100">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div className="space-y-2">
                        <div className="h-4 w-52 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
                      </div>
                      <div className="h-4 w-14 animate-pulse rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="flex min-h-[420px] items-center justify-center px-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500">
                      {isFiltering
                        ? "Tidak ada transaksi yang cocok."
                        : "Belum ada transaksi."}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {isFiltering
                        ? "Coba ubah kata kunci atau filter."
                        : "Riwayat top up dan pemakaian kredit akan muncul di sini."}
                    </p>
                  </div>
                </div>
              ) : (
                <div
                  className={`divide-y divide-slate-100 transition-opacity ${
                    loading ? "opacity-50" : "opacity-100"
                  }`}
                >
                  {items.map((item) => {
                    const isPositive = item.amount > 0;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-6 py-4"
                      >
                        <div className="min-w-0 pr-4">
                          <p className="truncate text-sm font-medium text-slate-800">
                            {item.label || TYPE_LABEL[item.type] || "Transaksi"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {TYPE_LABEL[item.type] ?? item.type} ·{" "}
                            {formatDate(item.date)}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={`text-sm font-semibold ${
                              isPositive ? "text-emerald-600" : "text-slate-600"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {item.amount.toLocaleString("id-ID")}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            Saldo {item.balance_after.toLocaleString("id-ID")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {pagination.total > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
                <p className="text-xs text-slate-400">
                  {from}–{to} dari {pagination.total.toLocaleString("id-ID")}
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    aria-label="Halaman sebelumnya"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <span className="px-2 text-xs font-medium text-slate-500">
                    {page} / {pagination.total_pages}
                  </span>

                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.total_pages, p + 1))
                    }
                    disabled={page >= pagination.total_pages || loading}
                    aria-label="Halaman berikutnya"
                    className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
