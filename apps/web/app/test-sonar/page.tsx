"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Send, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useApi } from '@/hooks/use-api'
import type { QueryResponse } from '@/lib/api-client'

export default function TestSonarPage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<QueryResponse | null>(null)
  const { createQuery, isLoading, error } = useApi()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const response = await createQuery({ raw_query: query.trim() })
    if (response) {
      setResult(response)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Sonar API Test</h1>
          <p className="text-muted-foreground mt-2">
            Test the Curiosity Engine with Perplexity Sonar API integration
          </p>
        </div>

        {/* Query Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>Submit a Query</CardTitle>
            <CardDescription>
              Enter a question or topic to search through the Sonar API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="query">Your Question</Label>
                <Textarea
                  id="query"
                  placeholder="Ask anything... e.g., 'What are the latest developments in AI research?'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Query
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2 text-red-600">
                <XCircle className="h-5 w-5" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Display */}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Query Result</CardTitle>
                <Badge className={getStatusColor(result.sonar_status)}>
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(result.sonar_status)}
                    <span className="capitalize">{result.sonar_status}</span>
                  </div>
                </Badge>
              </div>
              <CardDescription>
                Query ID: {result.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Original Query:</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {result.raw_query}
                </p>
              </div>

              {result.sonar_data && (
                <div>
                  <Label className="text-sm font-medium">Sonar API Response:</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(result.sonar_data, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {result.created_at && (
                <div>
                  <Label className="text-sm font-medium">Created:</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(result.created_at).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Backend Connection Status */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Connected to FastAPI Backend (localhost:8000)</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 