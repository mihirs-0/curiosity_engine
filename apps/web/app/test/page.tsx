"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { useApi, useQueries } from '@/hooks/use-api'

export default function TestPage() {
  const [query, setQuery] = useState('')
  const { createQuery, testConnection, isLoading } = useApi()
  const { queries, refetch } = useQueries()
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null)

  const handleTestConnection = async () => {
    const isConnected = await testConnection()
    setConnectionStatus(isConnected)
  }

  const handleSubmitQuery = async () => {
    if (!query.trim()) return
    
    const result = await createQuery({ raw_query: query })
    if (result) {
      setQuery('')
      refetch()
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">API Test Page</h1>
      
      {/* Connection Test */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Backend Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={handleTestConnection} disabled={isLoading}>
              Test Connection
            </Button>
            {connectionStatus !== null && (
              <span className={`px-3 py-1 rounded ${
                connectionStatus 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {connectionStatus ? '✅ Connected' : '❌ Connection Failed'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Query Submission */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Submit Test Query</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a test query..."
              className="flex-1"
            />
            <Button 
              onClick={handleSubmitQuery} 
              disabled={isLoading || !query.trim()}
            >
              Submit Query
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Queries List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Queries</CardTitle>
        </CardHeader>
        <CardContent>
          {queries.length === 0 ? (
            <p className="text-gray-500">No queries yet. Submit one above to test!</p>
          ) : (
            <div className="space-y-4">
              {queries.map((q) => (
                <div key={q.id} className="border rounded p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{q.raw_query}</h3>
                    <span className={`px-2 py-1 rounded text-sm ${
                      q.sonar_status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : q.sonar_status === 'error'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {q.sonar_status}
                    </span>
                  </div>
                  {q.sonar_data && (
                    <pre className="text-sm bg-gray-100 p-2 rounded mt-2 overflow-auto">
                      {JSON.stringify(q.sonar_data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 