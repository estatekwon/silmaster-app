export const runtime = "nodejs";

import NextAuth, { type NextAuthOptions } from "next-auth";
import KakaoProvider from "next-auth/providers/kakao";
import GoogleProvider from "next-auth/providers/google";
import { createClient } from "@supabase/supabase-js";

// ── Supabase admin (서버 전용) ───────────────────────────────────────────────
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── NextAuth 설정 ────────────────────────────────────────────────────────────
const authOptions: NextAuthOptions = {
  providers: [
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  // 어댑터 없이 JWT 단독 사용 → Edge 호환 + 세션 안정
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    // 로그인 시 Supabase users 테이블에 upsert
    async signIn({ user }) {
      if (!user.email) return true;
      try {
        const db = getSupabaseAdmin();
        await db.from("users").upsert(
          {
            email: user.email,
            name: user.name ?? null,
            image: user.image ?? null,
          },
          { onConflict: "email", ignoreDuplicates: false }
        );
      } catch {
        // 저장 실패해도 로그인은 허용
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
