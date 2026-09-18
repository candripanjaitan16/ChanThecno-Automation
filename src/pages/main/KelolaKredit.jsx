import { useState } from "react";
import { Wallet, Zap, CheckCircle2, History, CreditCard } from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";

const CREDIT_BALANCE = 0;

const PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    credit: 250,
    price: 25000,
  },
  {
    id: "popular",
    name: "Popular",
    credit: 750,
    price: 65000,
    badge: "Terlaris",
  },
  {
    id: "pro",
    name: "Pro",
    credit: 2000,
    price: 150000,
    badge: "Hemat",
  },
  {
    id: "business",
    name: "Business",
    credit: 5000,
    price: 350000,
  },
];

const TOPUP_HISTORY = [];

function formatRupiah(value) {
  return value.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  });
}

export default function KelolaKredit() {
  const [selectedPackage, setSelectedPackage] = useState(PACKAGES[1].id);

  const activePackage = PACKAGES.find((pkg) => pkg.id === selectedPackage);

  function handleTopUp() {
    if (!activePackage) return;
  }

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

          <div className="mb-8 flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-white shadow-sm">
            <div>
              <p className="text-sm font-medium text-blue-100">
                Saldo Kredit Kamu
              </p>

              <p className="mt-2 text-4xl font-bold tracking-tight">
                {CREDIT_BALANCE.toLocaleString("id-ID")}
              </p>

              <p className="mt-1 text-sm text-blue-100">kredit tersisa</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4">
              <Wallet size={32} />
            </div>
          </div>

          <div className="mb-8">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Pilih Paket Top Up
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PACKAGES.map((pkg) => {
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
          </div>

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
              className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 sm:w-auto"
            >
              Top Up Sekarang
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center space-x-2 border-b border-slate-100 px-6 py-4">
              <History size={18} className="text-slate-400" />

              <h2 className="text-base font-semibold text-slate-900">
                Riwayat Top Up
              </h2>
            </div>

            <div className="min-h-[250px]">
              {TOPUP_HISTORY.length === 0 ? (
                <div className="flex min-h-[250px] items-center justify-center px-6">
                  <p className="text-sm text-slate-400">
                    Belum ada riwayat top up.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {TOPUP_HISTORY.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-6 py-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          Paket {item.package}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {item.date}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-600">
                          +{item.credit.toLocaleString("id-ID")} kredit
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {formatRupiah(item.price)}
                        </p>
                      </div>
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
