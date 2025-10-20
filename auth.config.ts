import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
  },
  callbacks: {
    authorized({ auth, request }) {
      return true // Allow all routes for now
    },
  },
  providers: [], // Providers will be added in auth.ts
}
