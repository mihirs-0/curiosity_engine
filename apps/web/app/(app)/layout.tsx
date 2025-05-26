"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/auth-context"
import Navigation from "@/components/navigation"
import Footer from "@/components/footer"
import BookmarksDrawer from "@/components/bookmarks-drawer"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"

export default function AppLayout(props: { children: React.ReactNode }) {
  const { children } = props
  const pathname = usePathname()
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState<Array<{ title: string; url: string; description?: string }>>([])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { toast } = useToast()

  // Load bookmarks from Supabase if user is logged in, otherwise from localStorage
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        if (user) {
          // Fetch bookmarks from Supabase
          const { data, error } = await supabase.from("bookmarks").select("*").eq("user_id", user.id)

          if (error) {
            console.error("Error fetching bookmarks:", error)
            return
          }

          if (data) {
            setBookmarks(
              data.map((bookmark) => ({
                title: bookmark.title,
                url: bookmark.url,
                description: bookmark.description,
              })),
            )
          }
        } else {
          // Fetch from localStorage for non-authenticated users
          const savedBookmarks = localStorage.getItem("driftboard-bookmarks")
          if (savedBookmarks) {
            setBookmarks(JSON.parse(savedBookmarks))
          }
        }
      } catch (error) {
        console.error("Error fetching bookmarks:", error)
      }
    }

    fetchBookmarks()
  }, [user])

  // Remove a bookmark
  const removeBookmark = async (url: string) => {
    try {
      if (user) {
        // Remove from Supabase
        const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("url", url)

        if (error) {
          throw error
        }

        // Update local state
        setBookmarks(bookmarks.filter((b) => b.url !== url))
      } else {
        // Remove from localStorage
        const newBookmarks = bookmarks.filter((b) => b.url !== url)
        setBookmarks(newBookmarks)
        localStorage.setItem("driftboard-bookmarks", JSON.stringify(newBookmarks))
      }
    } catch (error: any) {
      toast({
        title: "Error removing bookmark",
        description: error.message || "An error occurred while removing the bookmark.",
        variant: "destructive",
      })
    }
  }

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen)
  }

  // Only show the bookmarks drawer on /discover and /result/[id] pages
  const showBookmarksDrawer = pathname === "/discover" || pathname.startsWith("/result/")

  return (
    <>
      <Navigation onToggleBookmarks={toggleDrawer} showBookmarksButton={showBookmarksDrawer} />
      <main className="min-h-screen pt-16">
        {children}
        {showBookmarksDrawer && (
          <BookmarksDrawer
            bookmarks={bookmarks}
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            onRemoveBookmark={removeBookmark}
          />
        )}
      </main>
      <Footer />
    </>
  )
}
