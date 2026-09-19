import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../lib/auth";
import AuthShell, { ErrorBox, Field, SubmitButton } from "./AuthShell";

export default function Login() {
  const { user, checking, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.from || "/";

  if (!checking && user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Masuk ke akun"
      subtitle="Kelola kredit dan tugas AI kamu."
      footer={
        <>
          Belum punya akun?{" "}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Daftar gratis
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox>{error}</ErrorBox>

        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="Password kamu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <SubmitButton loading={loading}>Masuk</SubmitButton>
      </form>
    </AuthShell>
  );
}
