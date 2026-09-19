import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wallet,
  Zap,
  CheckCircle2,
  History,
  CreditCard,
  Loader2,
} from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";
import { api } from "../../lib/api";

function formatRupiah(value) {
  return Number(value).toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });
}

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

const STATUS_STYLE = {
  paid: { label: "Berhasil", className: "bg-emerald-50 text-emerald-600" },
  pending: { label: "Menunggu", className: "bg-amber-50 text-amber-600" },
  failed: { label: "Gagal", className: "bg-red-50 text-red-600" },
  expired: { label: "Kedaluwarsa", className: "bg-slate-100 text-slate-500" },
  canceled: { label: "Dibatalkan", className: "bg-slate-100 text-slate-500" },
};

/** Muat snap.js sekali saja. URL & client key datang dari backend. */
function loadSnap(src, clientKey) {
  return new Promise((resolve, reject) => {
    if (window.snap) return resolve(window.snap);

    const existing = document.querySelector("script[data-snap]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.snap));
      existing.addEventListener("error", reject);
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.snap = "1";
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => resolve(window.snap);
    script.onerror = () => reject(new Error("Gagal memuat halaman pembayaran."));
    document.body.appendChild(script);
  });
}

export default function KelolaKredit() {
  const [creditBalance, setCreditBalance] = useState(0);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loadingPackages, setLoadingPackages] = useState(true);
  const [packageError, setPackageError] = useState("");

  const [paying, setPaying] = useState(false);
  const [notice, setNotice] = useState(null); // { type: "success" | "error" | "info", text }

  const pollRef = useRef(null);

  const refreshAccount = useCallback(async () => {
    const [balanceData, orderData] = await Promise.all([
      api("/credits/balance.php"),
      api("/credits/orders.php"),
    ]);

    setCreditBalance(Number(balanceData.balance));
    setOrders(orderData.orders);
  }, []);

  // Muat paket + saldo + riwayat
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoadingPackages(true);
        setPackageError("");

        const [pkgData] = await Promise.all([
          api("/credits/packages.php"),
          refreshAccount(),
        ]);

        if (cancelled) return;

        const normalized = pkgData.packages.map((pkg) => ({
          id: String(pkg.id),
          name: pkg.name,
          credit: Number(pkg.credits),
          price: Number(pkg.price),
          badge: pkg.badge,
          description: pkg.description,
        }));

        setPackages(normalized);

        const popular = normalized.find(
          (pkg) => pkg.name.toLowerCase() === "popular",
        );

        setSelectedPackage(popular?.id || normalized[0]?.id || null);
      } catch (error) {
        if (cancelled) return;
        console.error("Gagal memuat Kelola Kredit:", error);
        setPackageError("Gagal mengambil paket kredit. Silakan coba lagi.");
      } finally {
        if (!cancelled) setLoadingPackages(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      clearInterval(pollRef.current);
    };
  }, [refreshAccount]);

  const activePackage = packages.find((pkg) => pkg.id === selectedPackage);

  /**
   * Setelah popup ditutup / selesai, tanya backend status order.
   * Backend memverifikasi ke Midtrans, jadi ini juga jaring pengaman
   * bila notifikasi webhook terlambat.
   */
  const checkOrder = useCallback(
    async (orderId, { silent = false } = {}) => {
      try {
        const { order } = await api(
          `/credits/order-status.php?order_id=${encodeURIComponent(orderId)}`,
        );

        if (order.status === "paid") {
          clearInterval(pollRef.current);
          await refreshAccount();
          setNotice({
            type: "success",
            text: `Pembayaran berhasil! ${order.credits.toLocaleString("id-ID")} kredit sudah ditambahkan.`,
          });
          return "paid";
        }

        if (["failed", "expired", "canceled"].includes(order.status)) {
          clearInterval(pollRef.current);
          await refreshAccount();
          setNotice({ type: "error", text: "Pembayaran tidak berhasil atau sudah kedaluwarsa." });
          return order.status;
        }

        if (!silent) {
          setNotice({
            type: "info",
            text: "Menunggu pembayaran kamu. Kredit otomatis masuk setelah pembayaran terkonfirmasi.",
          });
        }
        return "pending";
      } catch (error) {
        console.error("Gagal cek order:", error);
        return "error";
      }
    },
    [refreshAccount],
  );

  /** Cek berkala (maks ~2 menit) untuk metode seperti transfer bank / QRIS. */
  const startPolling = useCallback(
    (orderId) => {
      clearInterval(pollRef.current);
      let tries = 0;

      pollRef.current = setInterval(async () => {
        tries += 1;
        const result = await checkOrder(orderId, { silent: true });

        if (result !== "pending" && result !== "error") {
          clearInterval(pollRef.current);
        } else if (tries >= 24) {
          clearInterval(pollRef.current);
        }
      }, 5000);
    },
    [checkOrder],
  );

  async function handleTopUp() {
    if (!activePackage || paying) return;

    setNotice(null);
    setPaying(true);

    try {
      // Hanya kirim ID paket. Harga & jumlah kredit ditentukan server.
      const data = await api("/credits/topup.php", {
        method: "POST",
        body: { package_id: Number(activePackage.id) },
      });

      const snap = await loadSnap(data.snap_js, data.client_key);

      // Pesanan baru tercatat "Menunggu" di riwayat
      refreshAccount().catch(() => {});

      snap.pay(data.snap_token, {
        onSuccess: () => {
          checkOrder(data.order_id);
        },
        onPending: () => {
          setNotice({
            type: "info",
            text: "Menunggu pembayaran kamu. Kredit otomatis masuk setelah pembayaran terkonfirmasi.",
          });
          startPolling(data.order_id);
        },
        onError: () => {
          setNotice({ type: "error", text: "Pembayaran gagal. Silakan coba lagi." });
          refreshAccount().catch(() => {});
        },
        onClose: () => {
          // Popup ditutup: cek sekali, siapa tahu sudah dibayar
          checkOrder(data.order_id).then((r) => {
            if (r === "pending") startPolling(data.order_id);
          });
        },
      });
    } catch (error) {
      console.error("Top up gagal:", error);
      setNotice({
        type: "error",
        text: error.message || "Gagal memulai pembayaran.",
      });
    } finally {
      setPaying(false);
    }
  }

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
            <h1 className="text-2xl font-semibold text-slate-900">
              Kelola Kredit
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Top up kredit dan lihat riwayat pembelian kamu.
            </p>
          </div>

          {notice && (
            <div
              className={`mb-6 rounded-xl border px-4 py-3 text-sm ${noticeStyle[notice.type]}`}
            >
              {notice.text}
            </div>
          )}

          {/* Saldo Kredit */}
          <div className="mb-8 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white shadow-sm">
            <div>
              <p className="text-sm font-medium text-blue-100">
                Saldo Kredit Kamu
              </p>

              <p className="mt-2 text-4xl font-bold tracking-tight">
                {creditBalance.toLocaleString("id-ID")}
              </p>

              <p className="mt-1 text-sm text-blue-100">kredit tersisa</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4">
              <Wallet size={32} />
            </div>
          </div>

          {/* Paket */}
          <div className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Pilih Paket Top Up
            </h2>

            {loadingPackages ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-400">Memuat paket kredit...</p>
              </div>
            ) : packageError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-sm text-red-500">{packageError}</p>

                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600"
                >
                  Coba Lagi
                </button>
              </div>
            ) : packages.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-400">
                  Belum ada paket kredit.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {packages.map((pkg) => {
                  const isSelected = pkg.id === selectedPackage;

                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`relative flex flex-col items-start rounded-2xl border p-5 text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      {pkg.badge && (
                        <span className="absolute -top-2.5 right-4 rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          {pkg.badge}
                        </span>
                      )}

                      <div className="mb-3 rounded-xl bg-blue-100 p-2 text-blue-600">
                        <Zap size={18} />
                      </div>

                      <p className="text-sm font-semibold text-slate-800">
                        {pkg.name}
                      </p>

                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {pkg.credit.toLocaleString("id-ID")}

                        <span className="ml-1 text-xs font-medium text-slate-400">
                          kredit
                        </span>
                      </p>

                      <p className="mt-2 text-sm font-medium text-slate-500">
                        {formatRupiah(pkg.price)}
                      </p>

                      {isSelected && (
                        <CheckCircle2
                          size={20}
                          className="absolute right-4 top-4 text-blue-600"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Total Pembayaran */}
          <div className="mb-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center space-x-3">
              <div className="rounded-xl bg-slate-100 p-3 text-slate-600">
                <CreditCard size={20} />
              </div>

              <div>
                <p className="text-sm text-slate-500">Total Pembayaran</p>

                <p className="text-lg font-bold text-slate-900">
                  {activePackage ? formatRupiah(activePackage.price) : "-"}
                </p>
              </div>
            </div>

            <button
              onClick={handleTopUp}
              disabled={!activePackage || loadingPackages || paying}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {paying && <Loader2 size={16} className="animate-spin" />}
              {paying ? "Memproses..." : "Top Up Sekarang"}
            </button>
          </div>

          {/* Riwayat */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center space-x-2 border-b border-slate-100 px-6 py-4">
              <History size={18} className="text-slate-400" />

              <h2 className="text-base font-semibold text-slate-900">
                Riwayat Top Up
              </h2>
            </div>

            <div className="min-h-[250px]">
              {orders.length === 0 ? (
                <div className="flex min-h-[250px] items-center justify-center px-6">
                  <p className="text-sm text-slate-400">
                    Belum ada riwayat top up.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {orders.map((item) => {
                    const st = STATUS_STYLE[item.status] || STATUS_STYLE.pending;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-6 py-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            Paket {item.package}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {formatDate(item.date)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              item.status === "paid"
                                ? "text-emerald-600"
                                : "text-slate-400"
                            }`}
                          >
                            +{item.credit.toLocaleString("id-ID")} kredit
                          </p>

                          <div className="mt-0.5 flex items-center justify-end gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.className}`}
                            >
                              {st.label}
                            </span>

                            <span className="text-xs text-slate-400">
                              {formatRupiah(item.price)}
                            </span>
                          </div>
                        </div>
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
