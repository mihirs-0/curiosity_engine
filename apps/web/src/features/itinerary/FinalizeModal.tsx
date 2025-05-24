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
import { createBrowserClient } from "@/lib/supabase"

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
  const supabase = createBrowserClient()
  
  const [title, setTitle] = useState("")
  const [days, setDays] = useState(7)
  const [isGenerating, setIsGenerating] = useState(false)

  // Get authentication headers
  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }

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
      
      // Call the finalize API endpoint
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/finalize`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          title: title.trim(),
          days: days,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const generatedItinerary: GeneratedItinerary = await response.json()

      // Store the itinerary in the trip record
      if (user) {
        // Update Supabase record
        const { error } = await supabase
          .from("trips")
          .update({ 
            itinerary: generatedItinerary,
            updated_at: new Date().toISOString()
          })
          .eq("trip_id", tripId)
          .eq("user_id", user.id)

        if (error) {
          console.error("Error updating trip:", error)
          // Continue anyway since the itinerary was generated successfully
        }
      } else {
        // Update localStorage
        const savedTrips = localStorage.getItem("driftboard-trips")
        if (savedTrips) {
          const trips = JSON.parse(savedTrips)
          const tripIndex = trips.findIndex((t: any) => t.trip_id === tripId)
          if (tripIndex !== -1) {
            trips[tripIndex].itinerary = generatedItinerary
            trips[tripIndex].updated_at = new Date().toISOString()
            localStorage.setItem("driftboard-trips", JSON.stringify(trips))
          }
        }
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