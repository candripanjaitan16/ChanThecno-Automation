import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../lib/auth";

/**
 * Hanya untuk tampilan: pengguna non-admin dialihkan.
 * Keamanan sebenarnya ada di server (requireAdmin -> 403), bukan di sini.
 */
export default function AdminRoute() {
  const { user, checking } = useAuth();

  if (checking) return null;

  return user?.is_admin ? <Outlet /> : <Navigate to="/" replace />;
}
