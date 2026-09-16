"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Wallet,
  Terminal,
  ShieldBan,
  FlaskConical,
  Phone,
  QrCode,
  Settings,
  LogOut,
} from "lucide-react";

const menu = [
  { href: "/", label: "Halaman Utama", icon: LayoutDashboard },
  { href: "/topup", label: "Topup Credit", icon: Wallet },
  { href: "/perintah", label: "Perintah", icon: Terminal },
  { href: "/larangan", label: "Larangan", icon: ShieldBan },
  { href: "/test", label: "Test", icon: FlaskConical },
  { href: "/wa-numbers", label: "Nomor WA", icon: Phone },
  { href: "/qr", label: "Create QR WA", icon: QrCode },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin;

  return (
    <aside className="w-64 shrink-0 bg-panel border-r border-white/5 min-h-screen flex flex-col">
      <div className="px-5 py-6 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-purple flex items-center justify-center font-bold">
          C
        </div>
        <div>
          <div className="font-semibold leading-tight">ChanThecno</div>
          <div className="text-xs text-white/40 leading-tight">Automation</div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {menu.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                active
                  ? "bg-purple/20 text-white border border-purple/40"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1 px-3 text-xs uppercase tracking-wide text-white/30">
              Admin
            </div>
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                pathname.startsWith("/admin")
                  ? "bg-purple/20 text-white border border-purple/40"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Settings size={18} />
              Panel Admin
            </Link>
          </>
        )}
      </nav>

      {session && (
        <button
          onClick={() => signOut()}
          className="m-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/50 hover:bg-white/5 hover:text-white"
        >
          <LogOut size={16} />
          Keluar
        </button>
      )}
    </aside>
  );
}
