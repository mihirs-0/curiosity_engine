"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clipboard, Clock, Loader2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import ResultCard from "@/components/result-card"
import { useApi, useQueries } from "@/hooks/use-api"
import type { QueryResponse } from "@/lib/api-client"

// Helper function to extract highlights from Sonar data
const extractHighlights = (sonarData: any): string[] => {
  if (!sonarData?.choices?.[0]?.message?.content) return []
  
  const content = sonarData.choices[0].message.content
  
  // Extract bullet points or numbered lists from the content
  const lines = content.split('\n')
  const highlights = lines
    .filter((line: string) => line.trim().match(/^[-*•]\s+/) || line.trim().match(/^\d+\.\s+/))
    .map((line: string) => line.replace(/^[-*•]\s+|^\d+\.\s+/, '').trim())
    .slice(0, 7) // Limit to 7 highlights
  
  return highlights.length > 0 ? highlights : [content.substring(0, 200) + '...']
}

// Helper function to extract links from Sonar data
const extractLinks = (sonarData: any) => {
  if (!sonarData?.citations) return []
  
  return sonarData.citations.slice(0, 4).map((url: string, index: number) => ({
    title: `Source ${index + 1}`,
    url: url,
    description: `Reference from ${new URL(url).hostname}`
  }))
}

export default function DiscoverPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [currentResult, setCurrentResult] = useState<QueryResponse | null>(null)
  const router = useRouter()
  const { createQuery } = useApi()
  const { queries, refetch } = useQueries()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)

    try {
      // Make real API call to Sonar
      const result = await createQuery({ raw_query: query.trim() })
      
      if (result) {
        setCurrentResult(result)
        setQuery("")
        setShowResults(true)
        refetch() // Refresh the queries list
      }
    } catch (error) {
      console.error('Error creating query:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQueryClick = (id: string) => {
    router.push(`/result/${id}`)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-playfair mb-4">Discover Your Journey</h1>
          <p className="text-lg text-gray-600">Explore travel ideas powered by AI research</p>
        </div>

        <Card className="mb-8 shadow-lg border-amber-100">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle>What's your travel dream?</CardTitle>
            <CardDescription>Describe your ideal trip and get AI-powered insights</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="relative">
                  <Input
                    placeholder="e.g., 'I want to explore Greek islands for 10 days in summer'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full p-4 text-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400 pr-12"
                    disabled={isLoading}
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {isLoading ? "Getting AI insights from Sonar..." : "Press Enter or click Submit to get AI-powered travel insights"}
                </p>
              </div>
              <Button
                type="submit"
                className="self-end bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Submit"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {showResults && currentResult ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold font-playfair">AI Research Results</h2>
              <div className="flex gap-2">
                <div className={`px-3 py-1 rounded-full text-sm ${
                  currentResult.sonar_status === 'completed' 
                    ? 'bg-green-100 text-green-800'
                    : currentResult.sonar_status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {currentResult.sonar_status}
                </div>
                <Button variant="outline" onClick={() => setShowResults(false)} className="text-sm">
                  Back to Queries
                </Button>
              </div>
            </div>

            {currentResult.sonar_status === 'completed' && currentResult.sonar_data ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResultCard
                  id={currentResult.id}
                  title={currentResult.raw_query}
                  highlights={extractHighlights(currentResult.sonar_data)}
                  links={extractLinks(currentResult.sonar_data)}
                />
                
                {/* Raw Sonar Response Card for debugging */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="text-sm">Full AI Response</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto text-sm">
                      <pre className="whitespace-pre-wrap break-words">
                        {currentResult.sonar_data.choices?.[0]?.message?.content || 'No content available'}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : currentResult.sonar_status === 'error' ? (
              <Card className="border-red-200">
                <CardContent className="pt-6">
                  <div className="text-red-600">
                    <h3 className="font-medium mb-2">Error processing query</h3>
                    <p className="text-sm">{currentResult.sonar_data?.error || 'Unknown error occurred'}</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-4" />
                  <p>Processing your query with AI...</p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold font-playfair">Recent Queries</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {queries.map((q) => (
                <Card
                  key={q.id}
                  className="shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleQueryClick(q.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{q.raw_query}</CardTitle>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        q.sonar_status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : q.sonar_status === 'error'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {q.sonar_status}
                      </div>
                    </div>
                  </CardHeader>
                  <CardFooter className="pt-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {q.created_at 
                          ? formatDistanceToNow(new Date(q.created_at), { addSuffix: true })
                          : 'Recently'
                        }
                      </span>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
