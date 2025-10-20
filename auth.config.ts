import type { NextAuthOptions } from "next-auth"

export const authConfig: NextAuthOptions = {
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [], // Providers will be added in auth.ts
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
      }
      if (profile?.sub) {
        token.wikimedia_id = profile.sub as string
      }
      return token
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      if (token.wikimedia_id) {
        session.user.wikimedia_id = token.wikimedia_id as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
}
