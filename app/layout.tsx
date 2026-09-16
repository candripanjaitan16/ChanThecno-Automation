import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "ChanThecnoAutomation",
  description: "AI Automation Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
