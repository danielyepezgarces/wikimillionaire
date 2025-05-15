export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          wikimedia_id: string | null
          avatar_url: string | null
          email: string | null
          created_at: string
          last_login: string
        }
        Insert: {
          id?: string
          username: string
          wikimedia_id?: string | null
          avatar_url?: string | null
          email?: string | null
          created_at?: string
          last_login?: string
        }
        Update: {
          id?: string
          username?: string
          wikimedia_id?: string | null
          avatar_url?: string | null
          email?: string | null
          created_at?: string
          last_login?: string
        }
      }
      scores: {
        Row: {
          id: string
          user_id: string
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          created_at?: string
        }
      }
    }
  }
}
