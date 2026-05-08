import { createClient } from '@supabase/supabase-js'
import type { Transaction, Category } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars — copy .env.example to .env and fill in your values.')
}

export type Database = {
  public: {
    Tables: {
      transactions: { Row: Transaction }
      categories: { Row: Category }
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
