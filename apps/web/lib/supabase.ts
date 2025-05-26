// lib/supabase.ts
import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

//
// 1) Pull your two env-vars once (you've confirmed they exist).
//
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

//
// 2) Create exactly one Supabase client for the entire frontend.
//    We turn on `persistSession` so auth carries across reloads.
//
export function createBrowserClient() {
  return createSupabaseBrowserClient(url, key)
}

export const supabase = createClient(url, key, {
  auth: { persistSession: true },
})

//
// 3) Sanity-check on startup: log whatever session we find.
//    (You can remove this once you've verified it works.)
//
supabase
  .auth
  .getSession()
  .then(({ data: { session } }) => {
    console.log("[supabase] session on load:", session)
  })
  .catch((err) => {
    console.warn("[supabase] getSession error:", err)
  })