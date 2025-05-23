"use client"

import { useState, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function HeroSection() {
  const [scrollOpacity, setScrollOpacity] = useState(1)
  const [hoverCard, setHoverCard] = useState<number | null>(null)

  const destinations = [
    "Santorini Sunsets",
    "Athens Exploration",
    "Mediterranean Cuisine",
    "Coastal Retreats",
    "Island Hopping",
    "Local Cafés",
  ]

  // Handle scroll animation for the arrow
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const newOpacity = Math.max(0, 1 - scrollPosition / 200)
      setScrollOpacity(newOpacity)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Smooth scroll function
  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: "smooth",
    })
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Background image container */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/driftboard.png"
          alt="Mediterranean travel destinations"
          fill
          style={{ objectFit: "cover" }}
          priority
          className="opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/40 via-transparent to-sky-900/40"></div>
      </div>

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
        {/* Drifting title with European-style font */}
        <div className="mb-8 relative animate-drift">
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-bold text-white mb-4 tracking-tight drop-shadow-lg font-playfair">
            Drift Board
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white max-w-2xl mb-8 drop-shadow-md">
            Discover local gems and craft your perfect journey.
          </p>

          {/* Destination tags */}
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-2xl mx-auto">
            {destinations.map((destination, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/30 transition-all cursor-pointer"
              >
                {destination}
              </span>
            ))}
          </div>
        </div>

        {/* Buttons with improved visibility */}
        <div className="flex flex-col sm:flex-row gap-4 mt-6 z-20">
          <Link href="/discover">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium px-8 py-6 h-auto shadow-xl border-2 border-amber-400/30"
            >
              Start Exploring
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="border-2 border-white bg-black/30 backdrop-blur-md hover:bg-black/40 text-white font-medium px-8 py-6 h-auto shadow-xl"
          >
            Use Chrome Extension
          </Button>
        </div>
      </div>

      {/* Scroll down indicator */}
      <div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer transition-all duration-300 ease-in-out animate-bounce z-20"
        style={{ opacity: scrollOpacity }}
        onClick={scrollToContent}
      >
        <ChevronDown className="h-10 w-10 text-white" />
      </div>
    </div>
  )
}
