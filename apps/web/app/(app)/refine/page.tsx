"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

export default function RefinePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // Form state
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [companions, setCompanions] = useState<string>("")
  const [budget, setBudget] = useState<string>("")
  const [interests, setInterests] = useState<string[]>([])

  const handleInterestChange = (interest: string) => {
    setInterests(interests.includes(interest) ? interests.filter((i) => i !== interest) : [...interests, interest])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setLoading(false)
    router.push("/result")
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold font-playfair mb-4">Refine Your Journey</h1>
          <p className="text-lg text-gray-600">Tell us more about your travel preferences</p>
        </div>

        <Card className="shadow-lg border-amber-100">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
            <CardTitle>Travel Preferences</CardTitle>
            <CardDescription>Help us customize your perfect itinerary</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Travel Dates */}
              <div className="space-y-2">
                <Label className="text-base">Travel Dates</Label>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Label htmlFor="start-date" className="text-sm text-gray-500">
                      Start Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="start-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="end-date" className="text-sm text-gray-500">
                      End Date
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="end-date"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground",
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Travel Companions */}
              <div className="space-y-2">
                <Label htmlFor="companions" className="text-base">
                  Travel Companions
                </Label>
                <Select value={companions} onValueChange={setCompanions}>
                  <SelectTrigger id="companions" className="w-full">
                    <SelectValue placeholder="Who are you traveling with?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="couple">Couple</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="group">Group of Friends</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Interests */}
              <div className="space-y-3">
                <Label className="text-base">Interests</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="culture"
                      checked={interests.includes("culture")}
                      onCheckedChange={() => handleInterestChange("culture")}
                    />
                    <Label htmlFor="culture" className="text-sm font-normal">
                      Culture & History
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="food"
                      checked={interests.includes("food")}
                      onCheckedChange={() => handleInterestChange("food")}
                    />
                    <Label htmlFor="food" className="text-sm font-normal">
                      Food & Cuisine
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="nature"
                      checked={interests.includes("nature")}
                      onCheckedChange={() => handleInterestChange("nature")}
                    />
                    <Label htmlFor="nature" className="text-sm font-normal">
                      Nature & Landscapes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="adventure"
                      checked={interests.includes("adventure")}
                      onCheckedChange={() => handleInterestChange("adventure")}
                    />
                    <Label htmlFor="adventure" className="text-sm font-normal">
                      Adventure & Activities
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="relaxation"
                      checked={interests.includes("relaxation")}
                      onCheckedChange={() => handleInterestChange("relaxation")}
                    />
                    <Label htmlFor="relaxation" className="text-sm font-normal">
                      Relaxation & Wellness
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="nightlife"
                      checked={interests.includes("nightlife")}
                      onCheckedChange={() => handleInterestChange("nightlife")}
                    />
                    <Label htmlFor="nightlife" className="text-sm font-normal">
                      Nightlife & Entertainment
                    </Label>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <Label htmlFor="budget" className="text-base">
                  Budget
                </Label>
                <Select value={budget} onValueChange={setBudget}>
                  <SelectTrigger id="budget" className="w-full">
                    <SelectValue placeholder="Select your budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Budget-Friendly</SelectItem>
                    <SelectItem value="medium">Moderate</SelectItem>
                    <SelectItem value="high">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <CardFooter className="px-0 pt-6 flex justify-end">
                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Create My Itinerary"
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
