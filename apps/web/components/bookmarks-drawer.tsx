"use client"

import { useEffect } from "react"
import { X, ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"

interface BookmarksDrawerProps {
  bookmarks: Array<{ title: string; url: string; description?: string }>
  open: boolean
  onOpenChange: (open: boolean) => void
  onRemoveBookmark: (url: string) => void
}

export default function BookmarksDrawer(props: BookmarksDrawerProps) {
  const { bookmarks, open, onOpenChange, onRemoveBookmark } = props
  const { user } = useAuth()
  const { toast } = useToast()

  // Handle escape key to close drawer
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false)
      }
    }

    // Prevent body scrolling when drawer is open
    if (open) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleEscapeKey)
    } else {
      document.body.style.overflow = "auto"
    }

    return () => {
      document.body.style.overflow = "auto"
      window.removeEventListener("keydown", handleEscapeKey)
    }
  }, [open, onOpenChange])

  const handleRemoveBookmark = (url: string, title: string) => {
    onRemoveBookmark(url)

    toast({
      title: "Bookmark removed",
      description: `"${title}" has been removed from your bookmarks.`,
    })
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop for mobile */}
      <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={() => onOpenChange(false)} />

      <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Saved Bookmarks</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-64px)]">
          <div className="p-4">
            {bookmarks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No bookmarks saved yet.</p>
                <p className="text-sm mt-2">Save links from your search results to access them quickly later.</p>
                {!user && <p className="text-sm mt-4 text-amber-600">Sign in to save your bookmarks across devices.</p>}
              </div>
            ) : (
              <ul className="space-y-3">
                {bookmarks.map((bookmark, index) => (
                  <li key={index} className="border rounded-md p-3 hover:bg-gray-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{bookmark.title}</h3>
                        <a
                          href={bookmark.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline flex items-center mt-1"
                        >
                          <span className="truncate max-w-[180px]">{bookmark.url}</span>
                          <ExternalLink className="h-3 w-3 ml-1 flex-shrink-0" />
                        </a>
                        {bookmark.description && <p className="text-xs text-gray-500 mt-1">{bookmark.description}</p>}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveBookmark(bookmark.url, bookmark.title)}
                        className="h-8 w-8 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  )
}
