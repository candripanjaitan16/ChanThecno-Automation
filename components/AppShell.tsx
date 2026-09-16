"use client";

import { useSession, signIn } from "next-auth/react";
import Sidebar from "./Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/40">
        Memuat...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-panel border border-white/10 rounded-2xl p-10 text-center max-w-sm">
          <div className="w-12 h-12 rounded-xl bg-purple mx-auto mb-4 flex items-center justify-center font-bold text-xl">
            C
          </div>
          <h1 className="text-xl font-semibold mb-1">ChanThecnoAutomation</h1>
          <p className="text-white/40 text-sm mb-6">
            Masuk untuk mengelola AI automation Anda
          </p>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-purple hover:bg-purple/80 transition rounded-lg py-2.5 font-medium"
          >
            Masuk dengan Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
