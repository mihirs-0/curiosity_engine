"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bookmark, ExternalLink, Loader2, ArrowLeft } from 'lucide-react'
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { useQuery } from "@/hooks/use-api"
import type { QueryResponse } from "@/lib/api-client"

// Helper functions to extract data from Sonar response
const extractHighlights = (sonarData: any): string[] => {
  if (!sonarData?.choices?.[0]?.message?.content) return []
  
  const content = sonarData.choices[0].message.content
  
  // Extract bullet points or numbered lists from the content
  const lines = content.split('\n')
  const highlights = lines
    .filter((line: string) => line.trim().match(/^[-*•]\s+/) || line.trim().match(/^\d+\.\s+/))
    .map((line: string) => line.replace(/^[-*•]\s+|^\d+\.\s+/, '').trim())
    .slice(0, 10) // More highlights for the detail page
  
  if (highlights.length === 0) {
    // If no structured highlights, create them from paragraphs
    const paragraphs = content.split('\n\n').filter((p: string) => p.trim().length > 50)
    return paragraphs.slice(0, 5).map((p: string) => p.trim().substring(0, 150) + '...')
  }
  
  return highlights
}

const extractLinks = (sonarData: any) => {
  if (!sonarData?.citations) return []
  
  return sonarData.citations.map((url: string, index: number) => {
    const domain = new URL(url).hostname.replace('www.', '')
    const title = `${domain.charAt(0).toUpperCase() + domain.slice(1)} - Source ${index + 1}`
    
    return {
      title: title,
      url: url,
      description: `Reference source from ${domain}`
    }
  })
}

const getTitle = (query: QueryResponse): string => {
  if (!query.sonar_data?.choices?.[0]?.message?.content) {
    return query.raw_query
  }
  
  const content = query.sonar_data.choices[0].message.content
  const lines = content.split('\n').filter((line: string) => line.trim().length > 0)
  
  // Look for a title-like line (often the first substantial line or marked with ##)
  const titleLine = lines.find((line: string) => 
    line.trim().startsWith('##') || 
    (line.length > 20 && line.length < 100 && !line.includes('.'))
  )
  
  if (titleLine) {
    return titleLine.replace(/^##\s*/, '').trim()
  }
  
  return query.raw_query
}

export default function ResultPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [bookmarks, setBookmarks] = useState<Array<{ title: string; url: string; description?: string }>>([])
  const [bookmarkedLinks, setBookmarkedLinks] = useState<Set<string>>(new Set())
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Use the real API hook instead of mock data
  const { query: result, isLoading: loading, error } = useQuery(id)

  useEffect(() => {
    fetchBookmarks()
  }, [user])

  const fetchBookmarks = async () => {
    try {
      if (user) {
        // Fetch bookmarks from Supabase
        const { data, error } = await supabase.from("bookmarks").select("*").eq("user_id", user.id)

        if (error) {
          console.error("Error fetching bookmarks:", error)
          return
        }

        if (data) {
          setBookmarks(
            data.map((bookmark: any) => ({
              title: bookmark.title,
              url: bookmark.url,
              description: bookmark.description,
            })),
          )
          setBookmarkedLinks(new Set(data.map((bookmark: any) => bookmark.url)))
        }
      } else {
        // Fetch from localStorage for non-authenticated users
        const savedBookmarks = localStorage.getItem("driftboard-bookmarks")
        if (savedBookmarks) {
          const parsedBookmarks = JSON.parse(savedBookmarks)
          setBookmarks(parsedBookmarks)
          setBookmarkedLinks(new Set(parsedBookmarks.map((b: { url: string }) => b.url)))
        }
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error)
    }
  }

  const toggleBookmark = async (link: { title: string; url: string; description?: string }) => {
    try {
      setBookmarkLoading(true)

      if (user) {
        // Handle Supabase bookmarks
        if (bookmarkedLinks.has(link.url)) {
          // Remove bookmark
          const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("url", link.url)

          if (error) {
            throw error
          }

          toast({
            title: "Bookmark removed",
            description: `"${link.title}" has been removed from your bookmarks.`,
          })
        } else {
          // Add bookmark
          const { error } = await supabase.from("bookmarks").insert({
            user_id: user.id,
            title: link.title,
            url: link.url,
            description: link.description || "",
          })

          if (error) {
            throw error
          }

          toast({
            title: "Bookmark added",
            description: `"${link.title}" has been added to your bookmarks.`,
          })
        }

        // Refresh bookmarks
        fetchBookmarks()
      } else {
        // Handle localStorage bookmarks
        let newBookmarks = [...bookmarks]
        const newBookmarkedLinks = new Set(bookmarkedLinks)

        if (bookmarkedLinks.has(link.url)) {
          // Remove bookmark
          newBookmarks = bookmarks.filter((b) => b.url !== link.url)
          newBookmarkedLinks.delete(link.url)

          toast({
            title: "Bookmark removed",
            description: `"${link.title}" has been removed from your bookmarks.`,
          })
        } else {
          // Add bookmark
          newBookmarks.push(link)
          newBookmarkedLinks.add(link.url)

          toast({
            title: "Bookmark added",
            description: `"${link.title}" has been added to your bookmarks.`,
          })
        }

        setBookmarks(newBookmarks)
        setBookmarkedLinks(newBookmarkedLinks)
        localStorage.setItem("driftboard-bookmarks", JSON.stringify(newBookmarks))
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred while managing bookmarks.",
        variant: "destructive",
      })
    } finally {
      setBookmarkLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading your AI insights...</h2>
        </div>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Query not found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the query you're looking for.</p>
          <Link href="/discover">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              Back to Discover
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const title = getTitle(result)
  const highlights = result.sonar_data ? extractHighlights(result.sonar_data) : []
  const links = result.sonar_data ? extractLinks(result.sonar_data) : []

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Hero Title Section */}
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-orange-50 p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-start mb-4">
            <Button variant="ghost" onClick={() => router.back()} className="text-amber-700 hover:bg-amber-100 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className={`px-3 py-1 rounded-full text-sm ${
              result.sonar_status === 'completed' 
                ? 'bg-green-100 text-green-800'
                : result.sonar_status === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {result.sonar_status}
            </div>
          </div>
          <h1 className="text-4xl font-bold font-playfair mb-4">{title}</h1>
          <p className="text-gray-600">Original query: {result.raw_query}</p>
        </div>

        {result.sonar_status === 'completed' && result.sonar_data ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Highlights Section */}
            {highlights.length > 0 && (
              <div className="md:col-span-2">
                <Card className="shadow-md h-full">
                  <CardHeader>
                    <CardTitle>AI Research Highlights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 list-disc list-inside">
                      {highlights.map((highlight, index) => (
                        <li key={index} className="text-gray-700 leading-relaxed">
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Links Section */}
            {links.length > 0 && (
              <div className="md:col-span-1">
                <Card className="shadow-md h-full">
                  <CardHeader>
                    <CardTitle>Source References</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-4">
                      {links.map((link: any, index: number) => (
                        <li key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                          <div className="flex justify-between items-start mb-1">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline font-medium flex items-center text-sm"
                            >
                              {link.title}
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </a>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${
                                bookmarkedLinks.has(link.url) ? "text-amber-500" : "text-gray-400"
                              } hover:text-amber-600`}
                              onClick={() =>
                                toggleBookmark({
                                  title: link.title,
                                  url: link.url,
                                  description: link.description,
                                })
                              }
                              disabled={bookmarkLoading}
                            >
                              {bookmarkLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Bookmark
                                  className="h-4 w-4"
                                  fill={bookmarkedLinks.has(link.url) ? "currentColor" : "none"}
                                />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600">{link.description}</p>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : result.sonar_status === 'error' ? (
          <Card className="border-red-200">
            <CardContent className="pt-6">
              <div className="text-red-600 text-center">
                <h3 className="font-medium mb-2">Error processing query</h3>
                <p className="text-sm">{result.sonar_data?.error || 'Unknown error occurred'}</p>
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

        {/* Action Button */}
        {result.sonar_status === 'completed' && (
          <div className="mt-8 flex justify-center">
            <Button
              onClick={() => router.push(`/trips/preferences/${id}`)}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-8 py-6 h-auto shadow-xl border-2 border-amber-400/30 rounded-full"
              size="lg"
            >
              <span className="mr-2">✨</span> Make This Trip Happen
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
