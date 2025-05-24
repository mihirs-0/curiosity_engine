"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Check } from "lucide-react"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/components/ui/use-toast"
import { createBrowserClient } from "@/lib/supabase"

interface Message {
  id: string
  content: string
  sender: {
    id: string
    name: string
    avatar?: string
  }
  timestamp: string
  role: "user" | "assistant"
  suggestions?: Array<{
    suggestion: string
    day?: number
    tags?: string[]
  }>
}

interface TripChatProps {
  tripId: string
  initialMessages?: Message[]
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export default function TripChat({ tripId, initialMessages = [] }: TripChatProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = createBrowserClient()
  
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [newMessage, setNewMessage] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

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

  // Parse suggestions from assistant message content
  const parseSuggestions = (content: string) => {
    const suggestions: Array<{suggestion: string, day?: number, tags?: string[]}> = []
    const jsonRegex = /\{[^}]*"suggestion"[^}]*\}/g
    const matches = content.match(jsonRegex)
    
    if (matches) {
      matches.forEach(match => {
        try {
          const parsed = JSON.parse(match)
          if (parsed.suggestion) {
            suggestions.push(parsed)
          }
        } catch (e) {
          // Ignore malformed JSON
        }
      })
    }
    
    return suggestions
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sendingMessage) return

    setSendingMessage(true)

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      content: newMessage,
      sender: {
        id: user?.id || "guest",
        name: user?.user_metadata?.full_name || user?.email || "You",
        avatar: user?.user_metadata?.avatar_url,
      },
      timestamp: new Date().toISOString(),
      role: "user",
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage("")

    try {
      // Get auth headers
      const headers = await getAuthHeaders()
      
      // Call the real API endpoint
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: newMessage }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      
      // Parse suggestions from the assistant response
      const suggestions = parseSuggestions(data.assistant.content)
      
      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${data.assistant.id}`,
        content: data.assistant.content,
        sender: {
          id: "assistant",
          name: "Trip Assistant",
        },
        timestamp: data.assistant.created_at || new Date().toISOString(),
        role: "assistant",
        suggestions,
      }

      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
      
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        content: "Sorry, I encountered an error. Please try again.",
        sender: {
          id: "assistant",
          name: "Trip Assistant",
        },
        timestamp: new Date().toISOString(),
        role: "assistant",
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setSendingMessage(false)
    }
  }

  const handleAddToTrip = async (messageId: string, suggestion: any) => {
    const suggestionKey = `${messageId}-${suggestion.suggestion}`
    
    if (selectedSuggestions.has(suggestionKey)) {
      return // Already selected
    }

    try {
      // Get auth headers
      const headers = await getAuthHeaders()
      
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/chat/select`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          message_id: messageId,
          payload: suggestion,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Mark as selected
      setSelectedSuggestions(prev => new Set([...prev, suggestionKey]))
      
      toast({
        title: "Added to Trip",
        description: "Suggestion added to your itinerary!",
      })
      
    } catch (error) {
      console.error("Error adding to trip:", error)
      toast({
        title: "Error",
        description: "Failed to add suggestion to trip. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="shadow-md h-full">
      <CardHeader>
        <CardTitle>Trip Planning Assistant</CardTitle>
        <CardDescription>Ask questions and get personalized recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col h-[500px]">
          <ScrollArea className="flex-1 pr-4 mb-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div className="flex items-start max-w-[80%] gap-2">
                    {message.role === "assistant" && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={message.sender.avatar || "/placeholder.svg"}
                          alt={message.sender.name}
                        />
                        <AvatarFallback>{message.sender.name.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-amber-500 text-white"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <p>{message.content}</p>
                      
                      {/* Render suggestions with Add to Trip buttons */}
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.suggestions.map((suggestion, index) => {
                            const suggestionKey = `${message.id}-${suggestion.suggestion}`
                            const isSelected = selectedSuggestions.has(suggestionKey)
                            
                            return (
                              <div
                                key={index}
                                className="bg-white bg-opacity-90 rounded p-2 text-gray-800"
                              >
                                <p className="text-sm mb-2">{suggestion.suggestion}</p>
                                {suggestion.day && (
                                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded mr-2">
                                    Day {suggestion.day}
                                  </span>
                                )}
                                {suggestion.tags && suggestion.tags.map(tag => (
                                  <span
                                    key={tag}
                                    className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded mr-1"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                <Button
                                  size="sm"
                                  variant={isSelected ? "secondary" : "default"}
                                  className={`ml-2 ${
                                    isSelected
                                      ? "bg-green-100 text-green-800 cursor-default"
                                      : "bg-amber-500 hover:bg-amber-600 text-white"
                                  }`}
                                  onClick={() => handleAddToTrip(message.id, suggestion)}
                                  disabled={isSelected}
                                >
                                  {isSelected ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1" />
                                      Added
                                    </>
                                  ) : (
                                    "✓ Add to Trip"
                                  )}
                                </Button>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.role === "user" && (
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
                    )}
                  </div>
                </div>
              ))}
              {sendingMessage && (
                <div className="flex justify-start">
                  <div className="flex items-start max-w-[80%] gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>A</AvatarFallback>
                    </Avatar>
                    <div className="rounded-lg p-3 bg-blue-100 text-blue-800">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <Input
              placeholder="Ask about your trip..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={sendingMessage}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={sendingMessage || !newMessage.trim()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
            >
              {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send"}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  )
} 