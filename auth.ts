import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { getUserByWikimediaId, createUser, updateUser } from "./lib/db"
import { getGravatarUrl } from "./lib/gravatar"

// Custom Wikimedia provider since next-auth doesn't have a built-in one
const WikimediaProvider = {
  id: "wikimedia",
  name: "Wikimedia",
  type: "oauth" as const,
  authorization: {
    url: "https://meta.wikimedia.org/w/rest.php/oauth2/authorize",
    params: {
      scope: "basic",
    },
  },
  token: "https://meta.wikimedia.org/w/rest.php/oauth2/access_token",
  userinfo: "https://meta.wikimedia.org/w/rest.php/oauth2/resource/profile",
  clientId: process.env.WIKIMEDIA_CLIENT_ID,
  clientSecret: process.env.WIKIMEDIA_CLIENT_SECRET,
  profile(profile: any) {
    return {
      id: profile.sub,
      name: profile.username,
      email: profile.email,
      image: profile.email ? getGravatarUrl(profile.email) : null,
    }
  },
  style: {
    logo: "/wikimedia-logo.svg",
    text: "#000",
    bg: "#fff",
  },
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [WikimediaProvider],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "wikimedia" && profile) {
        try {
          // Check if user exists
          let dbUser = await getUserByWikimediaId(profile.sub as string)

          if (dbUser) {
            // Update existing user
            await updateUser(dbUser.id.toString(), {
              last_login: new Date(),
              email: profile.email as string || null,
              avatar_url: user.image || null,
            })
          } else {
            // Create new user
            dbUser = await createUser({
              username: profile.username as string,
              wikimedia_id: profile.sub as string,
              email: profile.email as string || null,
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
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      if (token.wikimedia_id) {
        session.user.wikimedia_id = token.wikimedia_id as string
      }
      return session
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id
      }
      if (profile?.sub) {
        token.wikimedia_id = profile.sub
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
})
