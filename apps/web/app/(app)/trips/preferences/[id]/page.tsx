"use client"

import type React from "react"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"   
import { useAuth } from "@/context/auth-context"
import { Loader2 } from "lucide-react"
import { useQuery, useApi } from "@/hooks/use-api"

export default function TripPreferencesPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const id = params.id as string
  
  // Use real query data instead of mock data
  const { query: queryData, isLoading: loadingQuery, error: queryError } = useQuery(id)
  const { createQuery } = useApi()

  const [isLoading, setIsLoading] = useState(false)
  const [luxuryLevel, setLuxuryLevel] = useState("moderate")
  const [travelWith, setTravelWith] = useState("partner")
  const [interests, setInterests] = useState<string[]>([])

  const handleInterestChange = (interest: string) => {
    setInterests(interests.includes(interest) ? interests.filter((i) => i !== interest) : [...interests, interest])
  }

  const generatePersonalizedItinerary = async () => {
    if (!queryData?.raw_query) return null

    // Create a personalized prompt based on user preferences
    const luxuryDescriptions = {
      budget: "budget-friendly and economical",
      moderate: "mid-range with balanced comfort and value", 
      luxury: "high-end luxury with premium experiences"
    }

    const travelWithDescriptions = {
      solo: "solo traveler",
      partner: "romantic couple",
      family: "family with children",
      friends: "group of friends"
    }

    const interestsList = interests.length > 0 
      ? ` with focus on: ${interests.join(", ")}`
      : ""

    const personalizedPrompt = `Based on this travel query: "${queryData.raw_query}"
    
    Create a detailed personalized itinerary for a ${luxuryDescriptions[luxuryLevel as keyof typeof luxuryDescriptions]} trip for a ${travelWithDescriptions[travelWith as keyof typeof travelWithDescriptions]}${interestsList}.
    
    Please provide:
    1. Day-by-day itinerary with specific recommendations
    2. Accommodation suggestions matching the ${luxuryLevel} level
    3. Restaurant and dining recommendations
    4. Activities and attractions suited for ${travelWith}
    5. Transportation options
    6. Budget estimates
    7. Local tips and insider knowledge
    
    Format the response with clear sections and practical details.`

    try {
      const result = await createQuery({ raw_query: personalizedPrompt })
      return result
    } catch (error) {
      console.error('Error generating personalized itinerary:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Generate personalized itinerary with Sonar
      toast({
        title: "Generating your personalized itinerary...",
        description: "Our AI is creating a custom trip plan based on your preferences.",
      })

      const personalizedItinerary = await generatePersonalizedItinerary()

      // Prepare trip data
      const tripPreferences = {
        trip_id: id,
        title: queryData?.raw_query || "Custom Trip",
        original_query_id: id,
        luxury_level: luxuryLevel,
        travel_with: travelWith,
        interests,
        personalized_itinerary_id: personalizedItinerary?.id || null,
        created_at: new Date().toISOString(),
        status: "active",
        user_id: user?.id || "guest",
      }
/*
      if (user) {
        // Save to Supabase
        const { error } = await supabase.from("trips").insert(tripPreferences)

        if (error) throw error
      } else {
        // Save to localStorage
        const savedTrips = localStorage.getItem("driftboard-trips")
          ? JSON.parse(localStorage.getItem("driftboard-trips") || "[]")
          : []

        savedTrips.push(tripPreferences)
        localStorage.setItem("driftboard-trips", JSON.stringify(savedTrips))
      }
      */
      const { error } = await supabase
         .from("trips")
         .insert({ ...tripPreferences, user_id: user?.id ?? "demo-user" })

      if (error) throw error

      toast({
        title: "Trip finalized!",
        description: personalizedItinerary 
          ? "Your personalized itinerary has been generated and your trip is ready!"
          : "Your trip preferences have been saved and your trip is ready for planning.",
      })

      // Redirect to trip dashboard
      router.push(`/trips/${id}`)
    } catch (error: any) {
      toast({
        title: "Error finalizing trip",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingQuery) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading your trip details...</h2>
        </div>
      </div>
    )
  }

  if (queryError || !queryData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Trip not found</h2>
          <p className="text-gray-600 mb-6">We couldn't find the trip you're looking for.</p>
          <Button
            onClick={() => router.push("/discover")}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            Back to Discover
          </Button>
        </div>
      </div>
    )
  }

  // Extract title from Sonar data or use raw query
  const tripTitle = queryData.sonar_data?.choices?.[0]?.message?.content
    ?.split('\n')
    .find((line: string) => line.trim().startsWith('##'))
    ?.replace(/^##\s*/, '')
    ?.trim() || queryData.raw_query

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-playfair mb-4">Customize Your Trip</h1>
          <p className="text-lg text-gray-600">Tell us more about how you want to experience this journey</p>
          <div className="mt-4 p-4 bg-amber-50 rounded-lg">
            <p className="text-sm text-gray-700 font-medium">Based on your query:</p>
            <p className="text-amber-800 italic">"{queryData.raw_query}"</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="shadow-lg border-amber-100 mb-8">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle>Travel Style & Preferences</CardTitle>
              <CardDescription>Help us create the perfect personalized itinerary with AI recommendations</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              {/* Luxury Level */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Luxury Level</Label>
                <RadioGroup
                  value={luxuryLevel}
                  onValueChange={setLuxuryLevel}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-amber-50 transition-colors">
                    <RadioGroupItem value="budget" id="budget" />
                    <Label htmlFor="budget" className="cursor-pointer flex-1">
                      <div className="font-medium">Budget-Friendly</div>
                      <div className="text-sm text-gray-500">Economical options that don't break the bank</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-amber-50 transition-colors">
                    <RadioGroupItem value="moderate" id="moderate" />
                    <Label htmlFor="moderate" className="cursor-pointer flex-1">
                      <div className="font-medium">Moderate</div>
                      <div className="text-sm text-gray-500">Balanced comfort and value</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-amber-50 transition-colors">
                    <RadioGroupItem value="luxury" id="luxury" />
                    <Label htmlFor="luxury" className="cursor-pointer flex-1">
                      <div className="font-medium">Luxury</div>
                      <div className="text-sm text-gray-500">Premium experiences and accommodations</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Travel Companions */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Who are you traveling with?</Label>
                <RadioGroup
                  value={travelWith}
                  onValueChange={setTravelWith}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-amber-50 transition-colors">
                    <RadioGroupItem value="solo" id="solo" />
                    <Label htmlFor="solo" className="cursor-pointer flex-1">
                      <div className="font-medium">Solo Adventure</div>
                      <div className="text-sm text-gray-500">Traveling on your own</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-amber-50 transition-colors">
                    <RadioGroupItem value="partner" id="partner" />
                    <Label htmlFor="partner" className="cursor-pointer flex-1">
                      <div className="font-medium">With Partner</div>
                      <div className="text-sm text-gray-500">Romantic getaway for two</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-amber-50 transition-colors">
                    <RadioGroupItem value="family" id="family" />
                    <Label htmlFor="family" className="cursor-pointer flex-1">
                      <div className="font-medium">Family Trip</div>
                      <div className="text-sm text-gray-500">With children or extended family</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border rounded-md p-4 cursor-pointer hover:bg-amber-50 transition-colors">
                    <RadioGroupItem value="friends" id="friends" />
                    <Label htmlFor="friends" className="cursor-pointer flex-1">
                      <div className="font-medium">Friend Group</div>
                      <div className="text-sm text-gray-500">Traveling with friends</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label className="text-base font-medium">What aspects are you most interested in?</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="culture"
                      checked={interests.includes("culture")}
                      onCheckedChange={() => handleInterestChange("culture")}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="culture" className="cursor-pointer">
                        Culture & History
                      </Label>
                      <p className="text-sm text-gray-500">Museums, historical sites, local traditions</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="food"
                      checked={interests.includes("food")}
                      onCheckedChange={() => handleInterestChange("food")}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="food" className="cursor-pointer">
                        Food & Cuisine
                      </Label>
                      <p className="text-sm text-gray-500">Restaurants, cooking classes, food tours</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="nature"
                      checked={interests.includes("nature")}
                      onCheckedChange={() => handleInterestChange("nature")}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="nature" className="cursor-pointer">
                        Nature & Outdoors
                      </Label>
                      <p className="text-sm text-gray-500">Hiking, beaches, natural wonders</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="adventure"
                      checked={interests.includes("adventure")}
                      onCheckedChange={() => handleInterestChange("adventure")}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="adventure" className="cursor-pointer">
                        Adventure & Activities
                      </Label>
                      <p className="text-sm text-gray-500">Water sports, zip-lining, thrilling experiences</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="relaxation"
                      checked={interests.includes("relaxation")}
                      onCheckedChange={() => handleInterestChange("relaxation")}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="relaxation" className="cursor-pointer">
                        Relaxation & Wellness
                      </Label>
                      <p className="text-sm text-gray-500">Spas, beaches, peaceful retreats</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="nightlife"
                      checked={interests.includes("nightlife")}
                      onCheckedChange={() => handleInterestChange("nightlife")}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="nightlife" className="cursor-pointer">
                        Nightlife & Entertainment
                      </Label>
                      <p className="text-sm text-gray-500">Bars, clubs, shows, evening activities</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center pt-4 pb-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-8 py-6 h-auto shadow-xl border-2 border-amber-400/30 rounded-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating AI Itinerary...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🤖</span> Generate Personalized AI Itinerary
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  )
}
