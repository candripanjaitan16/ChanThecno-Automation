import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  History,
  Settings,
  Cpu,
  LogOut,
  Menu,
  X,
  MessageSquare,
  QrCode,
  Square,
} from "lucide-react";

import LogoChanThecno from "../../assets/chanthecno.svg";
import { useAuth } from "../../lib/auth";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const profile = {
    name: user?.name || "Pengguna",
    email: user?.email || "",
    photo: null,
  };

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const menuItems = [
    {
      icon: <LayoutDashboard size={20} />,
      text: "Ringkasan",
      path: "/",
    },
    {
      icon: <Wallet size={20} />,
      text: "Kelola Kredit",
      path: "/kelola-kredit",
    },
    {
      icon: <History size={20} />,
      text: "Riwayat Transaksi",
      path: "/riwayat-transaksi",
    },
    {
      icon: <Square size={20} />,
      text: "Tugas AI",
      path: "/tugas-ai",
    },
    {
      icon: <MessageSquare size={20} />,
      text: "Test Chat",
      path: "/test-chat",
    },
    {
      icon: <QrCode size={20} />,
      text: "QR WhatsApp",
      path: "/qr-whatsapp",
    },
    {
      icon: <Settings size={20} />,
      text: "Pengaturan",
      path: "/pengaturan",
    },
    // Hanya tampil untuk admin. (Keamanan sebenarnya ada di server.)
    ...(user?.is_admin
      ? [
          {
            icon: <Cpu size={20} />,
            text: "Pengaturan AI",
            path: "/admin/ai",
          },
        ]
      : []),
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-xl border border-slate-100 bg-white p-2.5 text-slate-800 shadow-md transition hover:bg-slate-50"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Overlay Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 bottom-0 z-40
          flex w-64 flex-col justify-between
          border-r border-slate-100 bg-white p-5
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:sticky lg:h-screen lg:translate-x-0
        `}
      >
        {/* Bagian Atas */}
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center space-x-3 px-2 pt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl">
              <img
                src={LogoChanThecno}
                alt="ChanThecno"
                className="h-[26px] w-[26px]"
              />
            </div>

            <div>
              <h2 className="text-base font-bold leading-none tracking-tight text-slate-800">
                ChanThecno
              </h2>

              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Dashboard User
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex w-full items-center space-x-3 rounded-xl
                    px-4 py-3 text-sm font-medium transition-all
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                    }
                  `}
                >
                  <span
                    className={isActive ? "text-blue-600" : "text-slate-400"}
                  >
                    {item.icon}
                  </span>

                  <span>{item.text}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bagian Bawah */}
        <div className="space-y-4 border-t border-slate-100 pt-4">
          {/* Profile */}
          <div className="flex items-center space-x-3 px-2">
            {/* Foto Profil */}
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600 ring-2 ring-slate-100">
                {profile.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-slate-800">
                {profile.name}
              </h4>

              <p className="truncate text-xs text-slate-400">{profile.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition-all hover:bg-rose-50"
          >
            <LogOut size={20} className="text-rose-500" />

            <span>Keluar Aplikasi</span>
          </button>
        </div>
      </aside>
    </>
  );
}
