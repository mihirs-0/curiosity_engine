import { createBrowserClient } from './supabase'

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// Check if we're in development mode with dummy Supabase credentials
const isDevelopmentMode = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  return !supabaseUrl || 
         !supabaseAnonKey || 
         supabaseUrl.includes('your_supabase') || 
         supabaseAnonKey.includes('your_supabase') ||
         supabaseUrl === 'https://dummy.supabase.co'
}

// Types
export interface QueryCreate {
  raw_query: string
}

export interface QueryResponse {
  id: string
  raw_query: string
  sonar_data?: {
    error?: string
    [key: string]: any
  }
  sonar_status: 'pending' | 'completed' | 'error'
  created_at?: string
}

export interface ApiError {
  detail: string
  status_code?: number
}

class ApiClient {
  private baseUrl: string
  private supabase = createBrowserClient()

  constructor() {
    this.baseUrl = API_BASE_URL
  }

  /**
   * Get authentication headers for API requests
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // Skip authentication in development mode with dummy credentials
    if (isDevelopmentMode()) {
      console.log('🔧 Development mode: Skipping Supabase authentication')
      return headers
    }

    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
    } catch (error) {
      console.warn('⚠️ Failed to get Supabase session:', error)
      // Continue without authentication in case of error
    }

    return headers
  }

  /**
   * Generic API request handler with error handling
   */
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers = await this.getAuthHeaders()

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorData = await response.json() as ApiError
          errorMessage = errorData.detail || errorMessage
        } catch {
          // If error response isn't JSON, use status text
        }
        
        throw new Error(errorMessage)
      }

      return await response.json()
    } catch (error) {
      console.error(`API Request failed for ${endpoint}:`, error)
      throw error instanceof Error ? error : new Error('Unknown API error')
    }
  }

  /**
   * Create a new query (triggers Sonar API call)
   */
  async createQuery(queryData: QueryCreate): Promise<QueryResponse> {
    return this.request<QueryResponse>('/queries', {
      method: 'POST',
      body: JSON.stringify(queryData),
    })
  }

  /**
   * Get all queries for the current user
   */
  async getQueries(): Promise<QueryResponse[]> {
    return this.request<QueryResponse[]>('/queries')
  }

  /**
   * Get a specific query by ID
   */
  async getQuery(id: string): Promise<QueryResponse> {
    return this.request<QueryResponse>(`/queries/${id}`)
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health')
  }

  /**
   * Test connection to backend
   */
  async testConnection(): Promise<boolean> {
    try {
      const health = await this.healthCheck()
      return health.status === 'ok'
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient() 