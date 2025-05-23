"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Clipboard, Clock, Send } from "lucide-react"
import { mockQueries, type Query } from "@/lib/mock-data"
import { formatDistanceToNow } from "date-fns"

export default function PlanPage() {
  const [query, setQuery] = useState("")
  const [queries, setQueries] = useState<Query[]>(mockQueries)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    // Add the new query to the list
    const newQuery: Query = {
      id: `q${Date.now()}`,
      text: query,
      source: "manual",
      timestamp: new Date().toISOString(),
      status: "pending",
    }

    setQueries([newQuery, ...queries])
    setQuery("")

    // Navigate to the refine page
    router.push("/refine")
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-playfair mb-4">Query Board</h1>
          <p className="text-lg text-gray-600">Start planning your perfect Mediterranean journey</p>
        </div>

        <Card className="mb-8 shadow-lg border-amber-100">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle>What's your travel dream?</CardTitle>
            <CardDescription>Describe your ideal trip or paste a clipped query</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
              <div className="flex flex-col space-y-2">
                <Input
                  placeholder="e.g., 'I want to explore Greek islands for 10 days in summer'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full p-4 text-lg border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                />
                <p className="text-sm text-gray-500">Be specific about destinations, duration, and interests</p>
              </div>
              <Button
                type="submit"
                className="self-end bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                <Send className="mr-2 h-4 w-4" /> Submit
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold font-playfair">Previous Queries</h2>

          {queries.map((q) => (
            <Card key={q.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{q.text}</CardTitle>
                  <div className="flex items-center space-x-1">
                    {q.source === "clipped" ? (
                      <Clipboard className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Send className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-xs text-gray-400">{q.source === "clipped" ? "Clipped" : "Manual"}</span>
                  </div>
                </div>
              </CardHeader>
              <CardFooter className="pt-2 text-sm text-gray-500 flex justify-between">
                <div className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDistanceToNow(new Date(q.timestamp), { addSuffix: true })}</span>
                </div>
                <div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      q.status === "completed" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {q.status === "completed" ? "Completed" : "Pending"}
                  </span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
