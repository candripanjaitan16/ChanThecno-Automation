"use client";

import { useSession } from "next-auth/react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const isAdmin = (session?.user as any)?.isAdmin;

  if (status === "loading") return null;

  if (!isAdmin) {
    return (
      <div className="text-white/40">
        Akun ini tidak terdaftar sebagai admin. Tambahkan email ke{" "}
        <code>ADMIN_EMAILS</code> di .env.
      </div>
    );
  }

  return <div>{children}</div>;
}
