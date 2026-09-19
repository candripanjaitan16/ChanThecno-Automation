import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import AuthShell, { ErrorBox, Field, SubmitButton } from "./AuthShell";

export default function Register() {
  const { user, checking, login } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!checking && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      await api("/auth/register.php", {
        method: "POST",
        body: { name: name.trim(), email: email.trim(), password },
      });

      // Langsung login setelah daftar
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Buat akun baru"
      subtitle="Daftar sekarang dan dapatkan 150 kredit gratis."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Masuk
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <ErrorBox>{error}</ErrorBox>

        <Field
          label="Nama"
          type="text"
          autoComplete="name"
          placeholder="Nama lengkap"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

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
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <SubmitButton loading={loading}>Daftar</SubmitButton>
      </form>
    </AuthShell>
  );
}
