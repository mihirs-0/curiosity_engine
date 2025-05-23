import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface Query {
  id: string
  raw_query: string
  answer_markdown: string
  created_at: string
}

// Mock Supabase client for development and testing
export const supabaseMock = {
  from: (_table: string) => ({
    select: () => ({
      data: [] as Query[],
      error: null
    }),
    insert: (data: Record<string, unknown>) => ({
      data: [data],
      error: null
    })
  })
}; 