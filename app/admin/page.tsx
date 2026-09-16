import Link from "next/link";
import { Cpu, Users, Wallet } from "lucide-react";

export default function AdminHome() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold mb-8">Panel Admin</h1>

      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/models"
          className="bg-panel rounded-xl p-6 border border-white/5 hover:border-purple/50 transition"
        >
          <Cpu className="mb-3 text-purple" />
          <div className="font-semibold">Model AI</div>
          <div className="text-white/40 text-sm mt-1">
            Atur model, API key, dan endpoint secara bebas
          </div>
        </Link>

        <div className="bg-panel rounded-xl p-6 border border-white/5 opacity-50">
          <Users className="mb-3 text-white/40" />
          <div className="font-semibold">Kelola User</div>
          <div className="text-white/40 text-sm mt-1">Segera hadir</div>
        </div>

        <div className="bg-panel rounded-xl p-6 border border-white/5 opacity-50">
          <Wallet className="mb-3 text-white/40" />
          <div className="font-semibold">Riwayat Topup</div>
          <div className="text-white/40 text-sm mt-1">Segera hadir</div>
        </div>
      </div>
    </div>
  );
}
