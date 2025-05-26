"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"
import { Loader2, Calendar, Users, MessageSquare, Bookmark, ArrowLeft, Sparkles, User, Zap } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import ShareTripDialog from "@/components/share-trip-dialog"
import { formatDistanceToNow } from "date-fns"
import { useQuery, useApi } from "@/hooks/use-api"
import type { QueryResponse } from "@/lib/api-client"

// Import new components
import TripChat from "@/src/features/chat/TripChat"
import FinalizeModal from "@/src/features/itinerary/FinalizeModal"
import TripSidebar from "@/src/features/chat/TripSidebar"
import { supabase } from "@/lib/supabase"

interface Trip {
  trip_id: string
  title: string
  original_query_id?: string
  personalized_itinerary_id?: string
  luxury_level: string
  travel_with: string
  interests: string[]
  created_at: string
  status: string
  user_id: string
  itinerary?: any
}

interface Message {
  id: string
  content: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: string
  role: "user" | "assistant"
  suggestions?: Array<{
    suggestion: string
    day?: number
    tags?: string[]
  }>
}

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  status: "active" | "pending"
  lastActive?: string
}

interface Activity {
  id: string
  type: "message" | "bookmark" | "itinerary" | "join"
  user: {
    id: string
    name: string
    avatar?: string
  }
  content: string
  timestamp: string
}

// Helper functions to extract data from Sonar response
const extractHighlights = (sonarData: any): string[] => {
  if (!sonarData?.choices?.[0]?.message?.content) return []
  
  const content = sonarData.choices[0].message.content
  
  // Extract bullet points or numbered lists from the content
  const lines = content.split('\n')
  const highlights = lines
    .filter((line: string) => line.trim().match(/^[-*•]\s+/) || line.trim().match(/^\d+\.\s+/))
    .map((line: string) => line.replace(/^[-*•]\s+|^\d+\.\s+/, '').trim())
    .slice(0, 8)
  
  if (highlights.length === 0) {
    // If no structured highlights, create them from paragraphs
    const paragraphs = content.split('\n\n').filter((p: string) => p.trim().length > 50)
    return paragraphs.slice(0, 5).map((p: string) => p.trim().substring(0, 120) + '...')
  }
  
  return highlights
}

const extractLinks = (sonarData: any) => {
  if (!sonarData?.citations) return []
  
  return sonarData.citations.slice(0, 6).map((url: string, index: number) => {
    const domain = new URL(url).hostname.replace('www.', '')
    const title = `${domain.charAt(0).toUpperCase() + domain.slice(1)} Resource ${index + 1}`
    
    return {
      title: title,
      url: url,
      description: `Research source from ${domain}`
    }
  })
}

export default function TripDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { user } = useAuth()
  const { toast } = useToast()

  // Use real query data instead of mock data
  const { query: originalQuery, isLoading: queryLoading, error: queryError } = useQuery(id)

  const [trip, setTrip] = useState<Trip | null>(null)
  const [tripDetails, setTripDetails] = useState<any>(null)
  const [personalizedItinerary, setPersonalizedItinerary] = useState<QueryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [tripBookmarks, setTripBookmarks] = useState<Array<{ title: string; url: string; description?: string }>>([])
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [enriching, setEnriching] = useState(false)
  const [showFinalizeModal, setShowFinalizeModal] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchTripData = async () => {
      setLoading(true)
      try {
        // Fetch trip preferences
        if (user) {
          // From Supabase
          const { data, error } = await supabase
            .from("trips")
            .select("*")
            .eq("trip_id", id)
            .eq("user_id", user.id)
            .single()

          if (error) throw error
          setTrip(data)

          // If there's a personalized itinerary, fetch it
          if (data.personalized_itinerary_id) {
            // You could fetch the personalized itinerary here if needed
            // const { query: personalizedData } = useQuery(data.personalized_itinerary_id)
            // setPersonalizedItinerary(personalizedData)
          }
        } else {
          // From localStorage
          const savedTrips = localStorage.getItem("driftboard-trips")
          if (savedTrips) {
            const trips = JSON.parse(savedTrips)
            const foundTrip = trips.find((t: Trip) => t.trip_id === id)
            setTrip(foundTrip || null)
          }
        }

        // Wait for original query data and extract trip details
        if (originalQuery && originalQuery.sonar_data) {
          setTripDetails({
            highlights: extractHighlights(originalQuery.sonar_data),
            links: extractLinks(originalQuery.sonar_data),
          })
        }

        // Initialize chat with a welcome message
        setMessages([
          {
            id: "welcome",
            content: `Welcome to your trip planning assistant! I'm here to help you with your ${originalQuery?.raw_query || 'trip'}. How can I assist you today?`,
            sender: {
              id: "system",
              name: "Trip Assistant",
            },
            timestamp: new Date().toISOString(),
            role: "assistant",
          },
        ])

        // Extract bookmarks from Sonar data
        if (originalQuery?.sonar_data) {
          const links = extractLinks(originalQuery.sonar_data)
          setTripBookmarks(links)
        }

        // Mock collaborators for now
        setCollaborators([
          {
            id: "1",
            name: "Alex Johnson", 
            email: "alex@example.com",
            avatar: "/placeholder.svg?height=40&width=40",
            status: "active",
            lastActive: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          },
        ])

        // Mock activities
        setActivities([
          {
            id: "1",
            type: "join",
            user: {
              id: user?.id || "guest",
              name: user?.user_metadata?.full_name || user?.email || "You",
              avatar: user?.user_metadata?.avatar_url,
            },
            content: "started planning this trip",
            timestamp: new Date().toISOString(),
          },
        ])
      } catch (error) {
        console.error("Error fetching trip data:", error)
      } finally {
        setLoading(false)
      }
    }

    // Only fetch when we have the original query data
    if (originalQuery || (!queryLoading && queryError)) {
      fetchTripData()
    }
  }, [id, user, originalQuery, queryLoading, queryError])

  const handleEnrichItinerary = async () => {
    setEnriching(true)

    try {
      // Simulate API call to Sonar API
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Add a system message about the enrichment
      const enrichmentMessage: Message = {
        id: `enrichment-${Date.now()}`,
        content:
          "I've analyzed your preferences and enriched your itinerary with personalized recommendations. Check the Itinerary tab to see your day-by-day plan with local insights, hidden gems, and activities tailored to your interests.",
        sender: {
          id: "system",
          name: "Trip Assistant",
        },
        timestamp: new Date().toISOString(),
        role: "assistant",
      }

      setMessages((prev) => [...prev, enrichmentMessage])

      // Add to activities
      const newActivity: Activity = {
        id: `activity-${Date.now()}`,
        type: "itinerary",
        user: {
          id: user?.id || "guest",
          name: user?.user_metadata?.full_name || user?.email || "You",
          avatar: user?.user_metadata?.avatar_url,
        },
        content: "enriched the trip itinerary with Sonar AI",
        timestamp: new Date().toISOString(),
      }

      setActivities((prev) => [newActivity, ...prev])

      toast({
        title: "Itinerary Enriched",
        description: "Your itinerary has been enhanced with personalized recommendations",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to enrich itinerary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setEnriching(false)
    }
  }

  const handleItineraryGenerated = (itinerary: any) => {
    setTrip(prev => prev ? { ...prev, itinerary } : null)
  }

  const handleNavigateToItinerary = () => {
    setActiveTab("itinerary")
  }

  const handleActivityClick = (activity: Activity) => {
    switch (activity.type) {
      case "message":
        setActiveTab("chat")
        break
      case "bookmark":
        setActiveTab("bookmarks")
        break
      case "itinerary":
        setActiveTab("itinerary")
        break
    }
  }

  const getLuxuryLabel = (level: string) => {
    switch (level) {
      case "budget":
        return "Budget-Friendly"
      case "moderate":
        return "Moderate"
      case "luxury":
        return "Luxury"
      default:
        return "Moderate"
    }
  }

  const getTravelWithLabel = (type: string) => {
    switch (type) {
      case "solo":
        return "Solo Adventure"
      case "partner":
        return "With Partner"
      case "family":
        return "Family Trip"
      case "friends":
        return "Friend Group"
      default:
        return "With Partner"
    }
  }

  if (loading || queryLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading your trip dashboard...</h2>
        </div>
      </div>
    )
  }

  if (queryError || !originalQuery || (!trip && !queryLoading)) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Trip not found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the trip you're looking for. It may not have been saved yet.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/trips">
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                Back to My Trips
              </Button>
            </Link>
            <Link href="/discover">
              <Button variant="outline">
                Start New Trip
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Use trip title or original query as fallback
  const tripTitle = trip?.title || originalQuery?.raw_query || "Your Trip"

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push("/trips")}
              className="text-amber-700 hover:bg-amber-100 -ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Trips
            </Button>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
              <h1 className="text-3xl font-bold font-playfair">{tripTitle}</h1>
              <div className="flex items-center gap-2">
                <ShareTripDialog tripId={trip?.trip_id || id} tripTitle={tripTitle} />
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                  onClick={handleEnrichItinerary}
                  disabled={enriching}
                >
                  {enriching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 text-amber-500" />
                  )}
                  {enriching ? "Enriching..." : "Enrich Itinerary"}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center text-gray-700">
                <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                <span>{getLuxuryLabel(trip?.luxury_level || "moderate")}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <Users className="h-4 w-4 mr-2 text-amber-500" />
                <span>{getTravelWithLabel(trip?.travel_with || "partner")}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(trip?.interests || []).map((interest) => (
                <span key={interest} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main content area */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="bg-amber-50 p-1">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="chat">Trip Assistant</TabsTrigger>
                <TabsTrigger value="bookmarks">Saved Resources</TabsTrigger>
                <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Highlights Section */}
                  {tripDetails?.highlights && tripDetails.highlights.length > 0 && (
                    <div className="md:col-span-2">
                      <Card className="shadow-md h-full">
                        <CardHeader>
                          <CardTitle>Trip Highlights</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 list-disc list-inside">
                            {tripDetails.highlights.map((highlight: string, index: number) => (
                              <li key={index} className="text-gray-700">
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Links Section */}
                  {tripDetails?.links && tripDetails.links.length > 0 && (
                    <div className="md:col-span-1">
                      <Card className="shadow-md h-full">
                        <CardHeader>
                          <CardTitle>Useful Resources</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-4">
                            {tripDetails.links.map((link: any, index: number) => (
                              <li key={index} className="border-b pb-3 last:border-b-0 last:pb-0">
                                <a
                                  href={link.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-medium flex items-center"
                                >
                                  {link.title}
                                </a>
                                <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>

                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => setActiveTab("chat")}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Chat with Trip Assistant
                  </Button>
                </div>
              </TabsContent>

              {/* Chat Tab */}
              <TabsContent value="chat" className="space-y-6">
                <TripChat tripId={id} initialMessages={messages} />
              </TabsContent>

              {/* Bookmarks Tab */}
              <TabsContent value="bookmarks" className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle>Saved Resources</CardTitle>
                    <CardDescription>Bookmarks and resources specific to this trip</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {tripBookmarks.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Bookmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No bookmarks saved for this trip yet.</p>
                        <p className="text-sm mt-2">
                          Save links from your search results or trip assistant to access them quickly.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        {tripBookmarks.map((bookmark, index) => (
                          <li key={index} className="border rounded-md p-4 hover:bg-gray-50">
                            <h3 className="font-medium">{bookmark.title}</h3>
                            <a
                              href={bookmark.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline flex items-center mt-1"
                            >
                              Visit resource
                            </a>
                            {bookmark.description && (
                              <p className="text-sm text-gray-600 mt-2">{bookmark.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Itinerary Tab */}
              <TabsContent value="itinerary" className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle>Trip Itinerary</CardTitle>
                      <CardDescription>Your day-by-day travel plan</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setShowFinalizeModal(true)}
                    >
                      <Calendar className="h-4 w-4 text-amber-500" />
                      Generate Final Itinerary
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {trip?.itinerary ? (
                      <div className="space-y-6">
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-semibold">{trip.itinerary.title}</h3>
                          <p className="text-gray-600">{trip.itinerary.days?.length || 0} days planned</p>
                        </div>
                        
                        {trip.itinerary.days?.map((day: any, index: number) => (
                          <div key={day.day || index} className="border rounded-lg overflow-hidden">
                            <div className="bg-amber-50 p-4 border-b">
                              <h3 className="font-medium text-lg">Day {day.day}: {day.summary}</h3>
                            </div>
                            <div className="p-4 space-y-4">
                              {day.morning && (
                                <div className="flex items-start gap-3">
                                  <div className="bg-amber-100 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                                    AM
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Morning</h4>
                                    <p className="text-sm text-gray-600 mt-1">{day.morning}</p>
                                  </div>
                                </div>
                              )}
                              {day.afternoon && (
                                <div className="flex items-start gap-3">
                                  <div className="bg-amber-100 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                                    PM
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Afternoon</h4>
                                    <p className="text-sm text-gray-600 mt-1">{day.afternoon}</p>
                                  </div>
                                </div>
                              )}
                              {day.evening && (
                                <div className="flex items-start gap-3">
                                  <div className="bg-amber-100 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 mt-1">
                                    EVE
                                  </div>
                                  <div>
                                    <h4 className="font-medium">Evening</h4>
                                    <p className="text-sm text-gray-600 mt-1">{day.evening}</p>
                                  </div>
                                </div>
                              )}
                              {day.notes && day.notes.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-50 rounded">
                                  <h5 className="text-sm font-medium text-blue-800 mb-1">Notes:</h5>
                                  <ul className="text-sm text-blue-700 space-y-1">
                                    {day.notes.map((note: string, noteIndex: number) => (
                                      <li key={noteIndex}>• {note}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                        <h3 className="text-lg font-medium mb-2">No Itinerary Yet</h3>
                        <p className="text-gray-600 mb-6">
                          Generate a final itinerary based on your chat suggestions and preferences.
                        </p>
                        <Button
                          onClick={() => setShowFinalizeModal(true)}
                          className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Generate Final Itinerary
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TripSidebar
              tripId={id}
              collaborators={collaborators}
              activities={activities}
              onInviteClick={() => (document.querySelector('[data-trigger="share-trip-dialog"]') as HTMLElement)?.click()}
              onActivityClick={handleActivityClick}
            />
          </div>
        </div>
      </div>

      {/* Finalize Modal */}
      <FinalizeModal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        tripId={id}
        onItineraryGenerated={handleItineraryGenerated}
        onNavigateToItinerary={handleNavigateToItinerary}
      />
    </div>
  )
}
