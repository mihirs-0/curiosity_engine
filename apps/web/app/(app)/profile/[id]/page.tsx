"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { createBrowserClient } from "@/lib/supabase"
import { useAuth } from "@/context/auth-context"
import { Loader2, MapPin, Calendar, Users, Mail } from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  location?: string
  joined: string
}

interface Trip {
  trip_id: string
  title: string
  luxury_level: string
  travel_with: string
  interests: string[]
  created_at: string
  status: string
  user_id: string
}

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createBrowserClient()
  const userId = params.id as string

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [isCurrentUser, setIsCurrentUser] = useState(false)

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true)
      try {
        // Check if this is the current user's profile
        if (user && (userId === user.id || userId === "me")) {
          setIsCurrentUser(true)

          // If "me" is in the URL, redirect to the actual user ID
          if (userId === "me") {
            router.replace(`/profile/${user.id}`)
            return
          }

          // Set profile data from current user
          setProfile({
            id: user.id,
            name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            email: user.email || "",
            avatar: user.user_metadata?.avatar_url,
            bio: "Travel enthusiast and adventure seeker",
            location: "San Francisco, CA",
            joined: user.created_at || new Date().toISOString(),
          })

          // Fetch user's trips
          const { data: userTrips, error: tripsError } = await supabase
            .from("trips")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })

          if (tripsError) throw tripsError
          setTrips(userTrips || [])
        } else {
          // Fetch another user's profile (mock data for now)
          const mockProfile: UserProfile = {
            id: userId,
            name: "Alex Johnson",
            email: "alex@example.com",
            avatar: "/placeholder.svg?height=100&width=100",
            bio: "Passionate traveler exploring the world one destination at a time. Love food, culture, and adventure!",
            location: "New York, NY",
            joined: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(), // 1 year ago
          }

          // Mock trips for this user
          const mockTrips: Trip[] = [
            {
              trip_id: "shared1",
              title: "Italian Riviera Adventure: Cinque Terre & Beyond",
              luxury_level: "moderate",
              travel_with: "friends",
              interests: ["food", "culture", "nature"],
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
              status: "active",
              user_id: userId,
            },
            {
              trip_id: "shared2",
              title: "Barcelona Weekend Getaway",
              luxury_level: "luxury",
              travel_with: "partner",
              interests: ["food", "culture", "nightlife"],
              created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(), // 7 days ago
              status: "active",
              user_id: userId,
            },
          ]

          setProfile(mockProfile)
          setTrips(mockTrips)
          setIsCurrentUser(false)
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserProfile()
  }, [userId, user, router])

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
          <h2 className="text-xl font-medium text-gray-700">Loading profile...</h2>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">User not found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the user you're looking for.</p>
          <Link href="/trips">
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              Back to My Trips
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <Card className="shadow-md overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-amber-400 to-orange-400"></div>
            <div className="px-6 pb-6 relative">
              <div className="flex flex-col md:flex-row md:items-end -mt-16 md:space-x-6">
                <Avatar className="h-32 w-32 border-4 border-white shadow-md">
                  <AvatarImage src={profile.avatar || "/placeholder.svg"} alt={profile.name} />
                  <AvatarFallback className="text-4xl">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="mt-4 md:mt-0 md:mb-2 flex-1">
                  <h1 className="text-3xl font-bold font-playfair">{profile.name}</h1>
                  <div className="flex flex-wrap gap-3 mt-2">
                    {profile.location && (
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="text-sm">{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="text-sm">
                        Joined {formatDistanceToNow(new Date(profile.joined), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 md:mt-0">
                  {isCurrentUser ? (
                    <Link href="/profile">
                      <Button variant="outline">Edit Profile</Button>
                    </Link>
                  ) : (
                    <Button variant="outline" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Message
                    </Button>
                  )}
                </div>
              </div>
              {profile.bio && <p className="mt-6 text-gray-700">{profile.bio}</p>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold font-playfair">Travel Plans</h2>
            {isCurrentUser && (
              <Link href="/discover">
                <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                  Create New Trip
                </Button>
              </Link>
            )}
          </div>

          {trips.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-medium mb-2">No trips yet</h3>
              <p className="text-gray-600 mb-6">
                {isCurrentUser
                  ? "Start by exploring destinations and creating your first trip"
                  : `${profile.name} hasn't created any public trips yet`}
              </p>
              {isCurrentUser && (
                <Link href="/discover">
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    Discover Destinations
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trips.map((trip) => (
                <Link href={`/trips/${trip.trip_id}`} key={trip.trip_id} className="block">
                  <Card className="h-full shadow-md hover:shadow-lg transition-shadow border-amber-100">
                    <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                      <CardTitle className="text-xl">{trip.title}</CardTitle>
                      <CardDescription>
                        Created {formatDistanceToNow(new Date(trip.created_at), { addSuffix: true })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center text-gray-700">
                          <MapPin className="h-4 w-4 mr-2 text-amber-500" />
                          <span>{trip.title.split(":")[0]}</span>
                        </div>
                        <div className="flex items-center text-gray-700">
                          <Users className="h-4 w-4 mr-2 text-amber-500" />
                          <span>{getTravelWithLabel(trip.travel_with)}</span>
                        </div>
                        {trip.interests && trip.interests.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-4">
                            {trip.interests.slice(0, 3).map((interest) => (
                              <span
                                key={interest}
                                className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs"
                              >
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
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
