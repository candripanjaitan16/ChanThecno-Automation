import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  // Cek sesi saat aplikasi pertama dibuka
  useEffect(() => {
    let cancelled = false;

    api("/user/me.php")
      .then((data) => !cancelled && setUser(data.user))
      .catch(() => !cancelled && setUser(null))
      .finally(() => !cancelled && setChecking(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    await api("/auth/login.php", {
      method: "POST",
      body: { email, password },
    });

    // login.php hanya mengembalikan data dasar. Ambil profil lengkap (termasuk
    // is_admin) agar menu admin langsung muncul tanpa perlu refresh halaman.
    const me = await api("/user/me.php");
    setUser(me.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout.php", { method: "POST" });
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, checking, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
