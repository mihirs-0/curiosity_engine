"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Share2, Check, X, Mail } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"

interface ShareTripDialogProps {
  tripId: string
  tripTitle: string
}

export default function ShareTripDialog({ tripId, tripTitle }: ShareTripDialogProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [collaborators, setCollaborators] = useState<
    Array<{ id: string; email: string; name?: string; avatar?: string; status: "pending" | "accepted" }>
  >([
    {
      id: "1",
      email: "alex@example.com",
      name: "Alex Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      status: "accepted",
    },
    {
      id: "2",
      email: "taylor@example.com",
      name: "Taylor Smith",
      status: "pending",
    },
  ])
  const { toast } = useToast()

  const handleShareTrip = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Add new collaborator
      const newCollaborator = {
        id: `user-${Date.now()}`,
        email: email.trim(),
        status: "pending" as const,
      }

      setCollaborators([...collaborators, newCollaborator])
      setEmail("")

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${email}`,
      })
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const removeCollaborator = async (id: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setCollaborators(collaborators.filter((c) => c.id !== id))

      toast({
        title: "Collaborator removed",
        description: "The collaborator has been removed from this trip",
      })
    } catch (error: any) {
      toast({
        title: "Error removing collaborator",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Share Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Trip</DialogTitle>
          <DialogDescription>
            Invite others to collaborate on &quot;{tripTitle}&quot;. They&apos;ll be able to view and contribute to this
            trip.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleShareTrip}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !email.trim()}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Invite"}
                </Button>
              </div>
            </div>

            {collaborators.length > 0 && (
              <div className="space-y-4">
                <Label>Current collaborators</Label>
                <div className="space-y-3">
                  {collaborators.map((collaborator) => (
                    <div key={collaborator.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={collaborator.avatar || "/placeholder.svg"}
                            alt={collaborator.name || collaborator.email}
                          />
                          <AvatarFallback>
                            {collaborator.name
                              ? collaborator.name.charAt(0).toUpperCase()
                              : collaborator.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{collaborator.name || collaborator.email}</p>
                          {collaborator.name && <p className="text-xs text-gray-500">{collaborator.email}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {collaborator.status === "pending" ? (
                          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">Pending</span>
                        ) : (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                            <Check className="h-3 w-3 inline mr-1" />
                            Joined
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-500 hover:text-red-500"
                          onClick={() => removeCollaborator(collaborator.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <Label className="mb-2 block">Or share via link</Label>
              <div className="flex gap-2">
                <Input readOnly value={`https://driftboard.app/trips/share/${tripId}`} className="flex-1 bg-gray-50" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://driftboard.app/trips/share/${tripId}`)
                    toast({
                      title: "Link copied",
                      description: "Share link has been copied to clipboard",
                    })
                  }}
                >
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </form>
        <DialogFooter className="sm:justify-start">
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setIsOpen(false)
              toast({
                title: "Email invitations sent",
                description: "Collaborators will receive an email with instructions to join",
              })
            }}
          >
            <Mail className="mr-2 h-4 w-4" />
            Send all invitations
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
