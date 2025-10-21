/**
 * Database Provider Abstraction Layer
 * Supports Supabase, NeonDB, and MariaDB
 */

import { User } from './auth'

export interface DatabaseProvider {
  initialize(): Promise<void>
  getUserById(id: string): Promise<User | null>
  getUserByWikimediaId(wikimediaId: string): Promise<User | null>
  createUser(userData: {
    username: string
    wikimedia_id: string
    email?: string | null
    avatar_url?: string | null
    roles?: string[]
  }): Promise<User>
  updateUser(
    id: string,
    userData: {
      username?: string
      email?: string | null
      avatar_url?: string | null
      last_login?: Date
      roles?: string[]
    }
  ): Promise<User | null>
  storeRefreshToken(data: {
    user_id: string
    token: string
    expires_at: Date
    user_agent?: string
    ip_address?: string
  }): Promise<void>
  getRefreshToken(token: string): Promise<{
    user_id: string
    token: string
    expires_at: Date
    user_agent?: string
    ip_address?: string
  } | null>
  deleteRefreshToken(token: string): Promise<void>
}

/**
 * Factory function to create the appropriate database provider
 */
export function createDatabaseProvider(): DatabaseProvider {
  const dbType = process.env.DB_TYPE || 'mariadb'

  switch (dbType.toLowerCase()) {
    case 'supabase':
      return createSupabaseDatabaseProvider()
    case 'neondb':
    case 'neon':
      return createNeonDatabaseProvider()
    case 'mariadb':
    case 'mysql':
    default:
      return createMariaDBDatabaseProvider()
  }
}

/**
 * MariaDB/MySQL Database Provider Implementation
 */
function createMariaDBDatabaseProvider(): DatabaseProvider {
  // Use existing db.ts functions
  const db = require('./db')

  return {
    async initialize() {
      await db.initializeDatabase()
      
      // Add refresh_tokens table if it doesn't exist
      await db.query(`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          token VARCHAR(500) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          user_agent TEXT,
          ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `)

      // Add roles column to users table if it doesn't exist
      await db.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS roles JSON DEFAULT NULL
      `).catch(() => {
        // Column might already exist in MySQL, ignore error
      })

      console.log('MariaDB database provider initialized')
    },

    async getUserById(id: string) {
      return await db.getUserById(id)
    },

    async getUserByWikimediaId(wikimediaId: string) {
      return await db.getUserByWikimediaId(wikimediaId)
    },

    async createUser(userData) {
      const user = await db.createUser(userData)
      
      // Set default roles if provided
      if (userData.roles && userData.roles.length > 0) {
        await db.query(
          'UPDATE users SET roles = ? WHERE id = ?',
          [JSON.stringify(userData.roles), user.id]
        )
        user.roles = userData.roles
      }
      
      return user
    },

    async updateUser(id, userData) {
      const updateData: any = { ...userData }
      
      // Handle roles separately
      if (userData.roles) {
        await db.query(
          'UPDATE users SET roles = ? WHERE id = ?',
          [JSON.stringify(userData.roles), id]
        )
        delete updateData.roles
      }
      
      return await db.updateUser(id, updateData)
    },

    async storeRefreshToken(data) {
      await db.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address) VALUES (?, ?, ?, ?, ?)',
        [data.user_id, data.token, data.expires_at, data.user_agent || null, data.ip_address || null]
      )
    },

    async getRefreshToken(token) {
      const result = await db.query('SELECT * FROM refresh_tokens WHERE token = ?', [token])
      return result[0] || null
    },

    async deleteRefreshToken(token) {
      await db.query('DELETE FROM refresh_tokens WHERE token = ?', [token])
    },
  }
}

/**
 * Supabase Database Provider Implementation
 */
function createSupabaseDatabaseProvider(): DatabaseProvider {
  const { createClient } = require('@supabase/supabase-js')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase configuration')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)

  return {
    async initialize() {
      // Supabase tables should be created via migrations
      console.log('Supabase database provider initialized')
    },

    async getUserById(id: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) return null
      return data
    },

    async getUserByWikimediaId(wikimediaId: string) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('wikimedia_id', wikimediaId)
        .single()
      
      if (error) return null
      return data
    },

    async createUser(userData) {
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: userData.username,
          wikimedia_id: userData.wikimedia_id,
          email: userData.email || null,
          avatar_url: userData.avatar_url || null,
          roles: userData.roles || ['user'],
          last_login: new Date().toISOString(),
        }])
        .select()
        .single()
      
      if (error) throw error
      return data
    },

    async updateUser(id, userData) {
      const updateData: any = {}
      
      if (userData.username) updateData.username = userData.username
      if (userData.email !== undefined) updateData.email = userData.email
      if (userData.avatar_url !== undefined) updateData.avatar_url = userData.avatar_url
      if (userData.last_login) updateData.last_login = userData.last_login.toISOString()
      if (userData.roles) updateData.roles = userData.roles
      
      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) return null
      return data
    },

    async storeRefreshToken(data) {
      await supabase.from('refresh_tokens').insert([{
        user_id: data.user_id,
        token: data.token,
        expires_at: data.expires_at.toISOString(),
        user_agent: data.user_agent,
        ip_address: data.ip_address,
      }])
    },

    async getRefreshToken(token) {
      const { data, error } = await supabase
        .from('refresh_tokens')
        .select('*')
        .eq('token', token)
        .single()
      
      if (error) return null
      return data
    },

    async deleteRefreshToken(token) {
      await supabase.from('refresh_tokens').delete().eq('token', token)
    },
  }
}

/**
 * NeonDB Database Provider Implementation
 */
function createNeonDatabaseProvider(): DatabaseProvider {
  const { neon } = require('@neondatabase/serverless')
  
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL for NeonDB')
  }
  
  const sql = neon(connectionString)

  return {
    async initialize() {
      // Create tables if they don't exist
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(255) NOT NULL,
          wikimedia_id VARCHAR(255) UNIQUE,
          email VARCHAR(255),
          avatar_url TEXT,
          roles JSONB DEFAULT '["user"]'::jsonb,
          last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      await sql`
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(500) UNIQUE NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          user_agent TEXT,
          ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `
      
      console.log('NeonDB database provider initialized')
    },

    async getUserById(id: string) {
      const result = await sql`SELECT * FROM users WHERE id = ${id}`
      return result[0] || null
    },

    async getUserByWikimediaId(wikimediaId: string) {
      const result = await sql`SELECT * FROM users WHERE wikimedia_id = ${wikimediaId}`
      return result[0] || null
    },

    async createUser(userData) {
      const result = await sql`
        INSERT INTO users (username, wikimedia_id, email, avatar_url, roles, last_login)
        VALUES (
          ${userData.username},
          ${userData.wikimedia_id},
          ${userData.email || null},
          ${userData.avatar_url || null},
          ${JSON.stringify(userData.roles || ['user'])},
          NOW()
        )
        RETURNING *
      `
      return result[0]
    },

    async updateUser(id, userData) {
      const updates = []
      const values: any = {}
      
      if (userData.username) {
        updates.push('username = $username')
        values.username = userData.username
      }
      if (userData.email !== undefined) {
        updates.push('email = $email')
        values.email = userData.email
      }
      if (userData.avatar_url !== undefined) {
        updates.push('avatar_url = $avatar_url')
        values.avatar_url = userData.avatar_url
      }
      if (userData.last_login) {
        updates.push('last_login = $last_login')
        values.last_login = userData.last_login
      }
      if (userData.roles) {
        updates.push('roles = $roles')
        values.roles = JSON.stringify(userData.roles)
      }
      
      if (updates.length === 0) return null
      
      updates.push('updated_at = NOW()')
      
      const result = await sql`
        UPDATE users 
        SET ${sql(updates.join(', '))}
        WHERE id = ${id}
        RETURNING *
      `
      
      return result[0] || null
    },

    async storeRefreshToken(data) {
      await sql`
        INSERT INTO refresh_tokens (user_id, token, expires_at, user_agent, ip_address)
        VALUES (
          ${data.user_id},
          ${data.token},
          ${data.expires_at},
          ${data.user_agent || null},
          ${data.ip_address || null}
        )
      `
    },

    async getRefreshToken(token) {
      const result = await sql`SELECT * FROM refresh_tokens WHERE token = ${token}`
      return result[0] || null
    },

    async deleteRefreshToken(token) {
      await sql`DELETE FROM refresh_tokens WHERE token = ${token}`
    },
  }
}
