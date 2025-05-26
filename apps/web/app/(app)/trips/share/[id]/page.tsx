"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"

import { useToast } from "@/components/ui/use-toast"
import { Loader2, MapPin, Users, Sparkles, Check } from "lucide-react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { mockResults } from "@/lib/mock-data"
import { supabase } from "@/lib/supabase"

interface Trip {
  trip_id: string
  title: string
  luxury_level: string
  travel_with: string
  interests: string[]
  created_at: string
  status: string
  user_id: string
  owner?: {
    id: string
    name: string
    email: string
    avatar?: string
  }
}

export default function TripInvitationPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const tripId = params.id as string

  const [trip, setTrip] = useState<Trip | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    const fetchTripData = async () => {
      setLoading(true)
      try {
        // Mock trip data for the invitation
        const mockTrip: Trip = {
          trip_id: tripId,
          title: mockResults[tripId]?.title || "Italian Riviera Adventure: Cinque Terre & Beyond",
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
        }

        setTrip(mockTrip)
      } catch (error) {
        console.error("Error fetching trip data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTripData()
  }, [tripId])

  const handleAcceptInvitation = async () => {
    setAccepting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Invitation accepted",
        description: "You are now a collaborator on this trip",
      })

      // Redirect to the trip dashboard
      router.push(`/trips/${tripId}`)
    } catch (error: any) {
      toast({
        title: "Error accepting invitation",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setAccepting(false)
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading trip invitation...</h2>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Invitation not found</h2>
          <p className="text-gray-600 mb-6">This invitation may have expired or been revoked.</p>
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
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-amber-100">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 text-center">
            <CardTitle className="text-2xl font-playfair">Trip Invitation</CardTitle>
            <CardDescription>{trip.owner?.name} has invited you to collaborate on a trip</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center mb-6">
              <Avatar className="h-16 w-16">
                <AvatarImage src={trip.owner?.avatar || "/placeholder.svg"} alt={trip.owner?.name} />
                <AvatarFallback>{trip.owner?.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold">{trip.title}</h2>
              <p className="text-gray-600 mt-1">Join {trip.owner?.name} in planning this exciting journey</p>
            </div>

            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-4 w-4 mr-2 text-amber-500" />
                  <span>{trip.title.split(":")[0]}</span>
                </div>
                <div className="flex items-center text-gray-700">
                  <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                  <span>{getLuxuryLabel(trip.luxury_level)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center text-gray-700">
                  <Users className="h-4 w-4 mr-2 text-amber-500" />
                  <span>{getTravelWithLabel(trip.travel_with)}</span>
                </div>
              </div>
              {trip.interests && trip.interests.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {trip.interests.map((interest) => (
                    <span key={interest} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              onClick={handleAcceptInvitation}
              disabled={accepting}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {accepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              {accepting ? "Accepting..." : "Accept Invitation"}
            </Button>
            <p className="text-center text-sm text-gray-500">
              By accepting, you'll be able to view and contribute to this trip planning.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
