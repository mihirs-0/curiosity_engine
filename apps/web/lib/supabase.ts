import { createClient } from "@supabase/supabase-js"

// These environment variables are optional for local development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is properly configured (not just placeholder values)
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your_supabase') && 
  !supabaseAnonKey.includes('your_supabase') &&
  supabaseUrl.startsWith('https://')

// Create a single supabase client for the browser
export const createBrowserClient = () => {
  if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase environment variables not set or contain placeholder values - authentication will not work")
    // Return a mock client that won't cause errors
    return createClient("https://dummy.supabase.co", "dummy-key")
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

// For server components
export const createServerClient = () => {
  const serverUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  const isServerConfigured = serverUrl && 
    serverKey && 
    !serverUrl.includes('your_supabase') && 
    !serverKey.includes('your_supabase') &&
    serverUrl.startsWith('https://')
  
  if (!isServerConfigured) {
    console.warn("⚠️ Supabase environment variables not set or contain placeholder values - authentication will not work")
    // Return a mock client that won't cause errors
    return createClient("https://dummy.supabase.co", "dummy-key", {
      auth: {
        persistSession: false,
      },
    })
  }
  
  return createClient(serverUrl, serverKey, {
    auth: {
      persistSession: false,
    },
  })
}
