"use client"

import type React from "react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Calendar, MapPin } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase" 

interface FinalizeModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  onItineraryGenerated: (itinerary: any) => void
  onNavigateToItinerary: () => void
}

interface GeneratedItinerary {
  title: string
  days: Array<{
    day: number
    summary: string
    morning: string
    afternoon: string
    evening: string
    notes: string[]
  }>
}



const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function FinalizeModal({
  isOpen,
  onClose,
  tripId,
  onItineraryGenerated,
  onNavigateToItinerary,
}: FinalizeModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  
  const [title, setTitle] = useState("")
  const [days, setDays] = useState(7)
  const [isGenerating, setIsGenerating] = useState(false)
  // Get authentication headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` })
    }

    console.log("getAuthHeaders → session:", session)
    console.log("getAuthHeaders → headers:", headers)
    return headers
  }

  const handleGenerate = async () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your itinerary.",
        variant: "destructive",
      })
      return
    }

    if (days < 1 || days > 30) {
      toast({
        title: "Invalid Duration",
        description: "Please enter a duration between 1 and 30 days.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

        try {
      // Get auth headers
      const headers = await getAuthHeaders()
      console.log("handleGenerate → headers:", headers)
      
      // First check if there are any suggestions selected for this trip
      const { data: choicesData, error: choicesError } = await supabase
        .from("itinerary_choice")
        .select("payload")
        .eq("trip_id", tripId)
      
      if (choicesError) {
        console.error("Error checking suggestions:", choicesError)
      }
      
      const hasSelectedSuggestions = choicesData && choicesData.length > 0
      let generatedItinerary: GeneratedItinerary
      
      if (!hasSelectedSuggestions) {
        // If no suggestions are selected, create a basic itinerary based on trip info
        // Get trip details for context
        const { data: tripData, error: tripError } = await supabase
          .from("trips")
          .select("title, luxury_level, travel_with, interests, original_query_id")
          .eq("trip_id", tripId)
          .single()
          
        if (tripError) {
          throw new Error("Failed to fetch trip details")
        }
        
        // Create a basic itinerary structure
        generatedItinerary = {
          title: title.trim(),
          days: Array.from({ length: days }, (_, index) => ({
            day: index + 1,
            summary: `Day ${index + 1} of your ${tripData?.title || 'trip'}`,
            morning: "Morning activities to be planned",
            afternoon: "Afternoon activities to be planned", 
            evening: "Evening activities to be planned",
            notes: [
              `${tripData?.luxury_level} style accommodations`,
              `Suitable for ${tripData?.travel_with}`,
              ...(tripData?.interests || []).map((interest: string) => `${interest} activities`)
            ]
          }))
        }
        
        // Store directly without calling the backend finalize endpoint
        const { error: insertError } = await supabase
          .from("itineraries")
          .insert({
            query_id: null,
            theme: tripData?.luxury_level || 'moderate',
            sonar_json: generatedItinerary
          })
        
        if (insertError) {
          console.error("Error inserting itinerary:", insertError)
          throw new Error(`Failed to save itinerary: ${JSON.stringify(insertError)}`)
        }
      } else {
        // If suggestions exist, use the finalize endpoint
        const response = await fetch(`${API_BASE_URL}/trips/${tripId}/finalize`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: title.trim(),
            days: days,
          }),
        })
        
        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`HTTP error! status: ${response.status}: ${errorText}`)
        }
        
        generatedItinerary = await response.json()
      }

      if (!generatedItinerary?.days || !Array.isArray(generatedItinerary.days)) {
        throw new Error("Itinerary generation failed.");
      }

      // Pass the itinerary to parent component
      onItineraryGenerated(generatedItinerary)

      toast({
        title: "Itinerary Generated!",
        description: `Your ${days}-day itinerary "${title}" has been created successfully.`,
      })

      // Close modal and navigate to itinerary tab
      onClose()
      onNavigateToItinerary()

    } catch (error) {
      console.error("Error generating itinerary:", error)
      toast({
        title: "Generation Failed",
        description: "Failed to generate your itinerary. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleClose = () => {
    if (!isGenerating) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-amber-500" />
            Generate Final Itinerary
          </DialogTitle>
          <DialogDescription>
            Create a detailed day-by-day itinerary based on your selected suggestions and preferences.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input
              id="title"
              placeholder="My Amazing Trip"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              disabled={isGenerating}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="days" className="text-right">
              Duration
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="days"
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 1)}
                className="w-20"
                disabled={isGenerating}
              />
              <span className="text-sm text-gray-500">days</span>
            </div>
          </div>
          
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-800">
                <p className="font-medium">What happens next:</p>
                <ul className="mt-1 space-y-1 text-xs">
                  <li>• AI will analyze your selected suggestions</li>
                  <li>• Generate a coherent day-by-day plan</li>
                  <li>• Include timing, locations, and practical notes</li>
                  <li>• Save to your trip for easy access</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !title.trim()}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Generate Final Itinerary
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 