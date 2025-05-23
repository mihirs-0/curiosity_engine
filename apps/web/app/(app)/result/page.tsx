"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { mockResult } from "@/lib/mock-data"
import { Download, Share2, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ResultPage() {
  const result = mockResult

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold font-playfair">{result.title}</h1>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
          <p className="text-lg text-gray-600">{result.description}</p>
        </div>

        {/* Suggested Places Section */}
        {result.suggestedPlaces && (
          <Card className="mb-8 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle>Suggested Places</CardTitle>
              <CardDescription>Destinations that match your preferences</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {result.suggestedPlaces.map((place, index) => (
                  <div key={index} className="rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                    <div className="relative h-48 w-full">
                      <Image
                        src={place.image || "/placeholder.svg?height=200&width=300"}
                        alt={place.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{place.name}</h3>
                      <p className="text-gray-600 text-sm">{place.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Map Section */}
        {result.mapSection && (
          <Card className="mb-8 shadow-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle>Map Overview</CardTitle>
              <CardDescription>Visualize your journey</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative h-80 w-full bg-gray-200 flex items-center justify-center">
                <p className="text-gray-500">Interactive map would be displayed here</p>
                {/* Placeholder for map */}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Food Section */}
        {result.foodSection && (
          <Card className="mb-8 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle>Culinary Experiences</CardTitle>
              <CardDescription>Taste the local flavors</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Highlights</h3>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.foodSection.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start">
                      <Star className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Restaurant Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.foodSection.recommendations.map((restaurant, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-amber-50 transition-colors">
                      <h4 className="font-medium">{restaurant.name}</h4>
                      <p className="text-sm text-gray-600">Cuisine: {restaurant.cuisine}</p>
                      <p className="text-sm text-gray-600">Price: {restaurant.priceRange}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activities Section */}
        {result.activities && (
          <Card className="mb-8 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle>Activities & Experiences</CardTitle>
              <CardDescription>Make the most of your journey</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {result.activities.map((activity, index) => (
                  <div key={index} className="border-b pb-4 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold">{activity.name}</h3>
                      <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                        {activity.duration}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-1">{activity.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Accommodation Section */}
        {result.accommodation && (
          <Card className="mb-8 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
              <CardTitle>Where to Stay</CardTitle>
              <CardDescription>Accommodation options for your trip</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.accommodation.suggestions.map((place, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold">{place.name}</h3>
                    <p className="text-sm text-gray-600">Type: {place.type}</p>
                    <p className="text-sm text-gray-600">Price: {place.priceRange}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center mt-8">
          <Link href="/plan">
            <Button variant="outline" className="mr-4">
              Back to Query Board
            </Button>
          </Link>
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
            Refine This Itinerary
          </Button>
        </div>
      </div>
    </div>
  )
}
