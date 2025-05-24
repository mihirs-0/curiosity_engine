"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, MessageSquare, BookmarkCheck, Route } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useAuth } from "@/context/auth-context"
import { createBrowserClient } from "@/lib/supabase"

interface Collaborator {
  id: string
  name: string
  email: string
  avatar?: string
  status: "active" | "pending" | "typing"
  lastActive?: string
  isTyping?: boolean
}

interface Activity {
  id: string
  type: "message" | "bookmark" | "itinerary" | "join"
  user: {
    id: string
    name: string
    avatar?: string
  }
  content: string
  timestamp: string
}

interface TripSidebarProps {
  tripId: string
  collaborators: Collaborator[]
  activities: Activity[]
  onInviteClick: () => void
  onActivityClick: (activity: Activity) => void
}

export default function TripSidebar({
  tripId,
  collaborators: initialCollaborators,
  activities,
  onInviteClick,
  onActivityClick,
}: TripSidebarProps) {
  const { user } = useAuth()
  const supabase = createBrowserClient()
  
  const [collaborators, setCollaborators] = useState<Collaborator[]>(initialCollaborators)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [realtimeConnected, setRealtimeConnected] = useState(false)

  useEffect(() => {
    if (!tripId) return

    // Subscribe to chat messages for typing indicators
    const channel = supabase
      .channel(`chat_messages_${tripId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `trip_id=eq.${tripId}`,
        },
        (payload) => {
          console.log('New message:', payload)
          // Handle new message - could update activity feed here
        }
      )
      .on(
        'presence',
        { event: 'sync' },
        () => {
          console.log('Presence synced')
          const newState = channel.presenceState()
          updateCollaboratorStatus(newState)
        }
      )
      .on(
        'presence',
        { event: 'join' },
        ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences)
          updateCollaboratorStatus(channel.presenceState())
        }
      )
      .on(
        'presence',
        { event: 'leave' },
        ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences)
          updateCollaboratorStatus(channel.presenceState())
        }
      )
      .subscribe(async (status) => {
        console.log('Realtime status:', status)
        setRealtimeConnected(status === 'SUBSCRIBED')
        
        if (status === 'SUBSCRIBED' && user) {
          // Track user presence
          await channel.track({
            user_id: user.id,
            user_name: user.user_metadata?.full_name || user.email,
            online_at: new Date().toISOString(),
          })
        }
      })

    // Listen for typing events
    const typingChannel = supabase
      .channel(`typing_${tripId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('Typing event:', payload)
        handleTypingEvent(payload.payload)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(typingChannel)
    }
  }, [tripId, user, supabase])

  const updateCollaboratorStatus = (presenceState: any) => {
    setCollaborators(prev => 
      prev.map(collaborator => {
        const isPresent = Object.values(presenceState).some((presences: any) =>
          presences.some((presence: any) => presence.user_id === collaborator.id)
        )
        
        return {
          ...collaborator,
          status: isPresent ? 'active' : 'pending',
          lastActive: isPresent ? new Date().toISOString() : collaborator.lastActive,
        }
      })
    )
  }

  const handleTypingEvent = (payload: any) => {
    const { user_id, is_typing } = payload
    
    if (user_id === user?.id) return // Don't show own typing
    
    setTypingUsers(prev => {
      const newSet = new Set(prev)
      if (is_typing) {
        newSet.add(user_id)
      } else {
        newSet.delete(user_id)
      }
      return newSet
    })

    // Clear typing indicator after 3 seconds
    if (is_typing) {
      setTimeout(() => {
        setTypingUsers(prev => {
          const newSet = new Set(prev)
          newSet.delete(user_id)
          return newSet
        })
      }, 3000)
    }
  }

  const sendTypingEvent = (isTyping: boolean) => {
    const typingChannel = supabase.channel(`typing_${tripId}`)
    typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        user_id: user?.id,
        user_name: user?.user_metadata?.full_name || user?.email,
        is_typing: isTyping,
      }
    })
  }

  const getCollaboratorStatus = (collaborator: Collaborator) => {
    if (typingUsers.has(collaborator.id)) {
      return { text: "Typing...", color: "text-blue-600", dot: "bg-blue-500" }
    }
    
    if (collaborator.status === "active") {
      return { text: "Online", color: "text-green-600", dot: "bg-green-500" }
    }
    
    if (collaborator.status === "pending") {
      return { text: "Invitation pending", color: "text-amber-600", dot: "bg-amber-500" }
    }
    
    if (collaborator.lastActive) {
      return {
        text: `Active ${formatDistanceToNow(new Date(collaborator.lastActive), { addSuffix: true })}`,
        color: "text-gray-500",
        dot: "bg-gray-400"
      }
    }
    
    return { text: "Offline", color: "text-gray-500", dot: "bg-gray-400" }
  }

  const getActivityIcon = (type: Activity["type"]) => {
    switch (type) {
      case "message":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "bookmark":
        return <BookmarkCheck className="h-4 w-4 text-green-500" />
      case "itinerary":
        return <Route className="h-4 w-4 text-purple-500" />
      case "join":
        return <User className="h-4 w-4 text-amber-500" />
      default:
        return <User className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Collaborators Card */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            Collaborators
            {realtimeConnected && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-600">Live</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current User */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={user?.user_metadata?.avatar_url || "/placeholder.svg"}
                  alt={user?.user_metadata?.full_name || user?.email || "You"}
                />
                <AvatarFallback>
                  {user?.user_metadata?.full_name
                    ? user.user_metadata.full_name.charAt(0).toUpperCase()
                    : user?.email
                      ? user.email.charAt(0).toUpperCase()
                      : "Y"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">
                  {user?.user_metadata?.full_name || user?.email || "You"} (You)
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <p className="text-xs text-green-600">Online</p>
                </div>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Owner</span>
          </div>

          {/* Other Collaborators */}
          {collaborators.map((collaborator) => {
            const status = getCollaboratorStatus(collaborator)
            
            return (
              <div key={collaborator.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={collaborator.avatar || "/placeholder.svg"} alt={collaborator.name} />
                    <AvatarFallback>{collaborator.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{collaborator.name}</p>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${status.dot}`} />
                      <p className={`text-xs ${status.color}`}>
                        {status.text}
                      </p>
                    </div>
                  </div>
                </div>
                {collaborator.status === "pending" && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    Pending
                  </span>
                )}
              </div>
            )
          })}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onInviteClick}
          >
            <User className="h-4 w-4 mr-2" />
            Invite More People
          </Button>
        </CardContent>
      </Card>

      {/* Activity Feed */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={activity.user.avatar || "/placeholder.svg"} alt={activity.user.name} />
                    <AvatarFallback>{activity.user.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(activity.type)}
                      <p className="text-sm font-medium">{activity.user.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                    <p className="text-sm text-gray-700">{activity.content}</p>
                    {activity.type !== "join" && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-amber-600"
                        onClick={() => onActivityClick(activity)}
                      >
                        {activity.type === "message" && "View in chat"}
                        {activity.type === "bookmark" && "View bookmarks"}
                        {activity.type === "itinerary" && "View itinerary"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
} 