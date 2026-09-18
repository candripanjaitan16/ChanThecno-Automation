import { useState } from "react";
import {
  User,
  Lock,
  Bell,
  Save,
  Check,
  Camera,
  Mail,
  MessageCircle,
} from "lucide-react";
import Sidebar from "../../components/ui/Sidebar";

export default function Pengaturan() {
  const [name, setName] = useState("Alex Doe");
  const [email, setEmail] = useState("alex@example.com");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifWhatsapp, setNotifWhatsapp] = useState(false);
  const [notifTask, setNotifTask] = useState(true);
  const [savedMessage, setSavedMessage] = useState("");

  function showMessage(message) {
    setSavedMessage(message);

    setTimeout(() => {
      setSavedMessage("");
    }, 3000);
  }

  function handleSaveProfile() {
    showMessage("Perubahan profil berhasil disimpan.");
  }

  function handleSavePassword() {
    if (!password || !confirmPassword) {
      showMessage("Silakan isi password baru dan konfirmasi password.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Konfirmasi password tidak cocok.");
      return;
    }

    setPassword("");
    setConfirmPassword("");
    showMessage("Password berhasil diperbarui.");
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];

    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setProfileImage(imageUrl);
    showMessage("Foto profil berhasil dipilih.");
  }

  function NotificationToggle({ checked, onChange }) {
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`relative flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-all duration-200 ${
          checked ? "bg-blue-600 shadow-sm shadow-blue-500/30" : "bg-slate-200"
        }`}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        >
          {checked && <Check size={13} className="text-blue-600" />}
        </span>
      </button>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-slate-900">
              Pengaturan
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Kelola profil, keamanan, dan preferensi notifikasi kamu.
            </p>
          </div>

          {savedMessage && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              <Check size={17} />
              <span>{savedMessage}</span>
            </div>
          )}

          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <User size={18} className="text-slate-400" />

              <h2 className="text-base font-semibold text-slate-900">Profil</h2>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-start">
                <div className="relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Foto profil"
                      className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-100"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600 ring-4 ring-slate-100">
                      {name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm transition hover:bg-blue-700">
                    <Camera size={15} />

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="mt-4 text-center sm:ml-5 sm:mt-2 sm:text-left">
                  <p className="text-sm font-semibold text-slate-800">
                    Foto Profil
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    JPG, PNG atau WEBP. Gunakan foto yang mudah dikenali.
                  </p>

                  <label className="mt-3 inline-flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50">
                    Ganti Foto
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Nama
                </label>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Nomor WhatsApp
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={handleSaveProfile}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
              >
                <Save size={16} />
                <span>Simpan Profil</span>
              </button>
            </div>
          </div>

          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <Lock size={18} className="text-slate-400" />

              <h2 className="text-base font-semibold text-slate-900">
                Keamanan
              </h2>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Password Baru
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-600">
                  Konfirmasi Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={handleSavePassword}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
              >
                <Save size={16} />
                <span>Perbarui Password</span>
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
              <Bell size={18} className="text-slate-400" />

              <h2 className="text-base font-semibold text-slate-900">
                Notifikasi
              </h2>
            </div>

            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Mail size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Notifikasi Email
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Terima informasi dan pembaruan melalui email.
                    </p>
                  </div>
                </div>

                <NotificationToggle
                  checked={notifEmail}
                  onChange={setNotifEmail}
                />
              </div>

              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <MessageCircle size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Notifikasi WhatsApp
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Terima informasi dan pembaruan melalui WhatsApp.
                    </p>
                  </div>
                </div>

                <NotificationToggle
                  checked={notifWhatsapp}
                  onChange={setNotifWhatsapp}
                />
              </div>

              <div className="flex items-center justify-between gap-4 px-6 py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <Bell size={18} />
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Status Tugas AI
                    </p>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Beri tahu ketika tugas AI selesai atau mengalami masalah.
                    </p>
                  </div>
                </div>

                <NotificationToggle
                  checked={notifTask}
                  onChange={setNotifTask}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
