import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      wikimedia_id?: string
    } & DefaultSession["user"]
  }

  interface User {
    wikimedia_id?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    wikimedia_id?: string
  }
}

export {}
