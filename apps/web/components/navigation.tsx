"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import UserProfile from "@/components/user-profile"

interface NavigationProps {
  onToggleBookmarks?: () => void
  showBookmarksButton?: boolean
}

export default function Navigation(props: NavigationProps) {
  const { onToggleBookmarks, showBookmarksButton = false } = props
  const pathname = usePathname()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-sky-900/80 to-sky-900/0 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <h1 className="text-2xl font-bold text-white font-playfair">Drift Board</h1>
        </Link>

        <nav className="hidden md:flex space-x-6">
          <NavLink href="/" active={pathname === "/"}>
            Home
          </NavLink>
          <NavLink href="/discover" active={pathname === "/discover"}>
            Discover
          </NavLink>
          <NavLink href="/trips" active={pathname.startsWith("/trips")}>
            My Trips
          </NavLink>
          <NavLink href="#" active={false}>
            About
          </NavLink>
        </nav>

        <div className="flex items-center space-x-4">
          {showBookmarksButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleBookmarks}
              className="text-white hover:bg-white/10 hover:text-white"
              aria-label="Toggle bookmarks"
            >
              <Bookmark className="h-5 w-5" />
            </Button>
          )}
          <UserProfile />
        </div>
      </div>
    </header>
  )
}

function NavLink(props: { href: string; active: boolean; children: React.ReactNode }) {
  const { href, active, children } = props
  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium transition-colors hover:text-white/90",
        active ? "text-white" : "text-white/70",
      )}
    >
      {children}
    </Link>
  )
}
