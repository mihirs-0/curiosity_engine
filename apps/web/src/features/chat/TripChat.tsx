"use client";

import React, { useState, useRef, useEffect, FormEvent } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Check } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { ChatBubble } from "@/components/ui/Chatbubble";

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
interface Message {
  id: string;
  content: string;
  sender: { id: string; name: string; avatar?: string };
  timestamp: string;
  role: "user" | "assistant";
  is_json?: boolean;
}

interface TripChatProps {
  tripId: string;
  initialMessages?: Message[];
}

interface Suggestion {
  suggestion: string;
  day?: number;
  tags?: string[];
}

interface AssistantSuggestionBubbleProps {
  data: Suggestion;
  onAdd: () => void;
  added: boolean;
}

// ------------------------------------------------------------------
// Helper – detect JSON suggestion payloads coming from the assistant
// ------------------------------------------------------------------
const parseIsJsonSuggestion = (raw: string): boolean => {
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === "object" && "suggestion" in obj;
  } catch {
    return false;
  }
};

// ------------------------------------------------------------------
// Mini component for assistant-generated suggestions
// ------------------------------------------------------------------
function AssistantSuggestionBubble({
  data,
  onAdd,
  added,
}: AssistantSuggestionBubbleProps) {
  return (
    <div className="flex justify-start">
      <div className="flex items-start max-w-[80%] gap-2">
        <div className="bg-white/90 rounded p-3 shadow w-full text-gray-800">
          <p className="text-sm mb-2">{data.suggestion}</p>
          {data.day !== undefined && (
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded mr-2">
              Day {data.day}
            </span>
          )}
          {data.tags?.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded mr-1"
            >
              {tag}
            </span>
          ))}
          <Button
            size="sm"
            variant={added ? "secondary" : "default"}
            className={`ml-2 mt-2 ${
              added
                ? "bg-green-100 text-green-800 cursor-default"
                : "bg-amber-500 hover:bg-amber-600 text-white"
            }`}
            onClick={onAdd}
            disabled={added}
          >
            {added ? (
              <>
                <Check className="h-3 w-3 mr-1" /> Added
              </>
            ) : (
              "✓ Add to Trip"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// ==================================================================
// TripChat – main component
// ==================================================================
export default function TripChat({
  tripId,
  initialMessages = [],
}: TripChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // ---------------- state ----------------
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [seenIds, setSeenIds] = useState<Set<string>>(
    new Set(initialMessages.map((m) => m.id))
  );
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(
    new Set()
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ---------------- helpers ----------------
  const rowToMessage = (row: any): Message => ({
    id: String(row.id),
    content: row.content,
    sender: { id: row.user_id, name: row.user_id, avatar: undefined },
    timestamp: row.created_at,
    role: row.role as "user" | "assistant",
    is_json:
      row.role === "assistant" && typeof row.content === "string"
        ? parseIsJsonSuggestion(row.content)
        : false,
  });

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // ---------------- initial load + realtime ----------------
  useEffect(() => {
    let mounted = true;

    (async () => {
      const { data, error } = await supabase
        .from("chat_message")
        .select("id, user_id, role, content, created_at")
        .eq("trip_id", tripId)
        .order("created_at", { ascending: true });

      if (!mounted || error || !data) return;

      const batch = data.map(rowToMessage).filter((m) => !seenIds.has(m.id));
      if (batch.length) {
        setMessages((prev) => [...prev, ...batch]);
        setSeenIds((prev) => {
          const nxt = new Set(prev);
          batch.forEach((m) => nxt.add(m.id));
          return nxt;
        });
      }
    })();

    const channel = supabase
      .channel(`chat_message_trip_${tripId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_message",
          filter: `trip_id=eq.${tripId}`,
        },
        ({ new: row }) => {
          if (!mounted) return;
          const msg = rowToMessage(row);
          if (!seenIds.has(msg.id)) {
            setMessages((prev) => [...prev, msg]);
            setSeenIds((prev) => new Set(prev).add(msg.id));
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [tripId, seenIds]);

  // auto-scroll whenever messages change
  useEffect(scrollToBottom, [messages]);

  // ---------------- send message ----------------
  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    return headers;
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    // optimistic UI – show user's message immediately
    const tempId = `tmp-${Date.now()}`;
    const userMsg: Message = {
      id: tempId,
      content,
      sender: {
        id: user?.id ?? "anon",
        name: user?.email ?? "You",
      },
      timestamp: new Date().toISOString(),
      role: "user",
    };
    setMessages((prev) => [...prev, userMsg]);
    setNewMessage("");
    setSending(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to send");
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message ?? String(err),
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  // ---------------- suggestion click ----------------
  const handleAddToTrip = (id: string, payload: Suggestion) => {
    const key = `${id}-${payload.suggestion}`;
    setSelectedSuggestions((prev) => new Set(prev).add(key));
    // TODO: persist the activity/bookmark to backend
    console.log("Add to trip", payload);
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  <CardContent className="flex-1 overflow-y-hidden">
  <ScrollArea className="h-full pr-4">
    <div className="space-y-4">
      {messages.map((m) => {
        if (m.is_json) {
          const payload: Suggestion =
            typeof m.content === "string"
              ? (JSON.parse(m.content) as Suggestion)
              : (m.content as Suggestion);
          const key = `${m.id}-${payload.suggestion}`;
          return (
            <AssistantSuggestionBubble
              key={key}
              data={payload}
              added={selectedSuggestions.has(key)}
              onAdd={() => handleAddToTrip(m.id, payload)}
            />
          );
        }
        const text =
          typeof m.content === "string"
            ? m.content
            : JSON.stringify(m.content, null, 2);
        return (
          <ChatBubble
            key={m.id}
            role={m.role}
            text={text}
            timestamp={m.timestamp}
            avatar={m.sender.avatar}
            name={m.sender.name}
          />
        );
      })}

      {sending && (
        <div className="flex justify-start">
          {/* …thinking indicator… */}
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  </ScrollArea>
</CardContent>}
