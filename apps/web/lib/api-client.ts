
import { supabase } from "@/lib/supabase"

//
// 1) Base URL of your FastAPI backend
//
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

//
// 2) Simple dev-mode guard (optional)
//
const isDev = process.env.NODE_ENV === "development"

//
// 3) Types
//
export interface QueryCreate { raw_query: string }

export interface QueryResponse {
  id: string
  raw_query: string
  sonar_data?: { error?: string; [key: string]: any }
  sonar_status: "pending" | "completed" | "error"
  created_at?: string
}

export interface ApiError {
  detail: string
  status_code?: number
}

class ApiClient {
  private baseUrl = API_BASE_URL

  /** Build headers, including Bearer token if we have one */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (isDev) {
      console.log("🔧 Dev mode: skipping Supabase auth headers")
      return headers
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`
      }
    } catch (err) {
      console.warn("⚠️ Failed to get Supabase session:", err)
      // still return headers without Authorization
    }

    return headers
  }

  /** Generic fetch with built-in error handling */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const authHeaders = await this.getAuthHeaders()
    const headers     = { ...authHeaders, ...options.headers }

    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...headers, ...options.headers },
      })

      if (!res.ok) {
        let msg = `HTTP ${res.status}: ${res.statusText}`
        try {
          const json = (await res.json()) as ApiError
          msg = json.detail || msg
        } catch {
          /* non-JSON error, keep default */
        }
        throw new Error(msg)
      }

      return (await res.json()) as T
    } catch (err) {
      console.error(`API request failed (${endpoint}):`, err)
      throw err instanceof Error ? err : new Error("Unknown API error")
    }
  }

  /** Create a new query (kicks off Sonar) */
  async createQuery(data: QueryCreate): Promise<QueryResponse> {
    return this.request<QueryResponse>("/queries", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  /** List all queries for current user */
  async getQueries(): Promise<QueryResponse[]> {
    return this.request<QueryResponse[]>("/queries")
  }

  /** Fetch one query by ID */
  async getQuery(id: string): Promise<QueryResponse> {
    return this.request<QueryResponse>(`/queries/${id}`)
  }

  /** Ping health endpoint */
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>("/health")
  }

  /** Shortcut: returns true if backend responds `{ status: "ok" }` */
  async testConnection(): Promise<boolean> {
    try {
      const h = await this.healthCheck()
      return h.status === "ok"
    } catch {
      return false
    }
  }
}

// lib/api-client.ts
import { useAuth } from "@/hooks/useAuth"   // NEW

/** 
 * Small helper hook that returns headers with a fresh JWT.
 * Components that call ApiClient just run this hook first.
 */
export function useAuthHeaders() {
  const { session } = useAuth()
  const token = session?.access_token
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export const apiClient = new ApiClient()