"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { createBrowserClient } from "@/lib/supabase"
import { Loader2, MapPin, Users, Sparkles, Share2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Trip {
  trip_id: string
  title: string
  luxury_level: string
  travel_with: string
  interests: string[]
  created_at: string
  status: string
  user_id: string
  shared_with?: Array<{
    id: string
    name: string
    email: string
    avatar?: string
    status: "active" | "pending"
  }>
  owner?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function TripsPage() {
  const [myTrips, setMyTrips] = useState<Trip[]>([])
  const [sharedTrips, setSharedTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const supabase = createBrowserClient()

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true)
      try {
        if (user) {
          // Fetch from Supabase
          const { data: ownTrips, error: ownTripsError } = await supabase
            .from("trips")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          if (ownTripsError) throw ownTripsError

          // Mock shared trips data
          const mockSharedTrips: Trip[] = [
            {
              trip_id: "shared1",
              title: "Italian Riviera Adventure: Cinque Terre & Beyond",
              luxury_level: "moderate",
              travel_with: "friends",
              interests: ["food", "culture", "nature"],
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
              status: "active",
              user_id: "other-user-1",
              owner: {
                id: "other-user-1",
                name: "Alex Johnson",
                email: "alex@example.com",
                avatar: "/placeholder.svg?height=40&width=40",
              },
            },
            {
              trip_id: "shared2",
              title: "Barcelona Weekend Getaway",
              luxury_level: "luxury",
              travel_with: "partner",
              interests: ["food", "culture", "nightlife"],
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
              status: "active",
              user_id: "other-user-2",
              owner: {
                id: "other-user-2",
                name: "Taylor Smith",
                email: "taylor@example.com",
              },
            },
          ]

          setMyTrips(ownTrips || [])
          setSharedTrips(mockSharedTrips)
        } else {
          // Fetch from localStorage
          const savedTrips = localStorage.getItem("driftboard-trips")
          if (savedTrips) {
            setMyTrips(JSON.parse(savedTrips))
          } else {
            setMyTrips([])
          }
          setSharedTrips([])
        }
      } catch (error) {
        console.error("Error fetching trips:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrips()
  }, [user])

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading your trips...</h2>
        </div>
      </div>
    )
  }

  const renderTripGrid = (trips: Trip[]) => {
    if (trips.length === 0) {
      return (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <Sparkles className="h-12 w-12 text-amber-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">No trips yet</h2>
          <p className="text-gray-600 mb-6">Start by exploring destinations and finalizing a trip</p>
          <Link href="/discover">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              Discover Destinations
            </Button>
          </Link>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trips.map((trip) => (
          <Link href={`/trips/${trip.trip_id}`} key={trip.trip_id} className="block">
            <Card className="h-full shadow-md hover:shadow-lg transition-shadow border-amber-100">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                <CardTitle className="text-xl">{trip.title}</CardTitle>
                <CardDescription className="flex items-center justify-between">
                  <span>Created {formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })}</span>
                  {trip.owner && (
                    <div className="flex items-center gap-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={trip.owner.avatar || "/placeholder.svg"} alt={trip.owner.name} />
                        <AvatarFallback>{trip.owner.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs">by {trip.owner.name}</span>
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="h-4 w-4 mr-2 text-amber-500" />
                    <span>{trip.title.split(":")[0]}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                    <span>{getLuxuryLabel(trip.luxury_level)}</span>
                  </div>
                  <div className="flex items-center text-gray-700">
                    <Users className="h-4 w-4 mr-2 text-amber-500" />
                    <span>{getTravelWithLabel(trip.travel_with)}</span>
                  </div>
                  {trip.interests && trip.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {trip.interests.slice(0, 3).map((interest) => (
                        <span key={interest} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                          {interest}
                        </span>
                      ))}
                      {trip.interests.length > 3 && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                          +{trip.interests.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Show collaborators for my trips */}
                  {!trip.owner && trip.shared_with && trip.shared_with.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">Shared with:</p>
                      <div className="flex -space-x-2">
                        {trip.shared_with.slice(0, 3).map((collaborator) => (
                          <Avatar key={collaborator.id} className="h-6 w-6 border-2 border-white">
                            <AvatarImage src={collaborator.avatar || "/placeholder.svg"} alt={collaborator.name} />
                            <AvatarFallback>{collaborator.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        ))}
                        {trip.shared_with.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs border-2 border-white">
                            +{trip.shared_with.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  Continue Planning
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-playfair mb-4">My Trips</h1>
          <p className="text-lg text-gray-600">Your personalized travel plans and adventures</p>
        </div>

        <Tabs defaultValue="my-trips" className="space-y-6">
          <TabsList className="bg-amber-50 p-1 mx-auto flex justify-center">
            <TabsTrigger value="my-trips" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              My Trips
            </TabsTrigger>
            <TabsTrigger value="shared-trips" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Shared with Me
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-trips">{renderTripGrid(myTrips)}</TabsContent>

          <TabsContent value="shared-trips">{renderTripGrid(sharedTrips)}</TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
