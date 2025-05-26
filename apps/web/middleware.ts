import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // Check if Supabase is properly configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // If Supabase is not configured, skip auth checks and continue
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl.includes('your_supabase') || 
      supabaseAnonKey.includes('your_supabase')) {
    console.warn("⚠️ Supabase not configured - skipping auth middleware")
    return res
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              req.cookies.set(name, value)
              res.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if the route requires authentication
    const authRoutes = ["/profile", "/settings"]
    const isAuthRoute = authRoutes.some((route) => req.nextUrl.pathname.startsWith(route))

    // If accessing an auth route without a session, redirect to sign in
    if (isAuthRoute && !session) {
      const redirectUrl = new URL("/auth/sign-in", req.url)
      redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If accessing auth pages with a session, redirect to discover
    if (req.nextUrl.pathname.startsWith("/auth") && session) {
      return NextResponse.redirect(new URL("/discover", req.url))
    }
  } catch (error) {
    console.warn("⚠️ Middleware auth check failed:", error instanceof Error ? error.message : String(error))
    // Continue without auth protection if Supabase fails
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
}
