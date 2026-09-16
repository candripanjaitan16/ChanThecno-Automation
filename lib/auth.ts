import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async session({ session }) {
      const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      const email = session.user?.email?.toLowerCase() || "";
      (session.user as any).isAdmin = adminEmails.includes(email);
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
