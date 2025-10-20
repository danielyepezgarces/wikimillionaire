import NextAuth, { type NextAuthOptions } from "next-auth"
import WikimediaProvider from "next-auth/providers/wikimedia"
import { authConfig } from "./auth.config"
import { getUserByWikimediaId, createUser, updateUser } from "./lib/db"
import { getGravatarUrl } from "./lib/gravatar"

export const authOptions: NextAuthOptions = {
  ...authConfig,
  providers: [
    WikimediaProvider({
      clientId: process.env.WIKIMEDIA_CLIENT_ID!,
      clientSecret: process.env.WIKIMEDIA_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.username,
          email: profile.email,
          image: profile.email ? getGravatarUrl(profile.email) : null,
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "wikimedia" && profile) {
        try {
          // Check if user exists
          let dbUser = await getUserByWikimediaId(profile.sub as string)

          if (dbUser) {
            // Update existing user
            await updateUser(dbUser.id.toString(), {
              last_login: new Date(),
              email: (profile.email as string) || null,
              avatar_url: user.image || null,
            })
          } else {
            // Create new user
            dbUser = await createUser({
              username: (profile as any).username as string,
              wikimedia_id: profile.sub as string,
              email: (profile.email as string) || null,
              avatar_url: user.image || null,
            })
          }

          // Store database user ID in the user object
          user.id = dbUser.id.toString()
        } catch (error) {
          console.error("Error processing user in database:", error)
          return false
        }
      }
      return true
    },
  },
}

export default NextAuth(authOptions)
