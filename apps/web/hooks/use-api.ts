import { useState, useEffect } from 'react'
import { apiClient, type QueryCreate, type QueryResponse } from '@/lib/api-client'
import { useToast } from '@/components/ui/use-toast'

export function useApi() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleApiCall = async <T>(
    apiCall: () => Promise<T>,
    successMessage?: string
  ): Promise<T | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiCall()
      
      if (successMessage) {
        toast({
          title: "Success",
          description: successMessage,
        })
      }
      
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    
    // Query operations
    createQuery: (queryData: QueryCreate) => 
      handleApiCall(() => apiClient.createQuery(queryData), 'Query submitted successfully!'),
    
    getQueries: () => 
      handleApiCall(() => apiClient.getQueries()),
    
    getQuery: (id: string) => 
      handleApiCall(() => apiClient.getQuery(id)),
    
    // Health check
    testConnection: () => 
      handleApiCall(() => apiClient.testConnection()),
  }
}

export function useQueries() {
  const [queries, setQueries] = useState<QueryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQueries = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await apiClient.getQueries()
      setQueries(result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch queries'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQueries()
  }, [])

  const refetch = () => {
    fetchQueries()
  }

  return {
    queries,
    isLoading,
    error,
    refetch,
  }
}

export function useQuery(id: string) {
  const [query, setQuery] = useState<QueryResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuery = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await apiClient.getQuery(id)
        setQuery(result)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch query'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchQuery()
    }
  }, [id])

  return {
    query,
    isLoading,
    error,
  }
} 