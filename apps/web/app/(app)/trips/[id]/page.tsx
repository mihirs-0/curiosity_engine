"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Sparkles, Users, MessageSquare, Bookmark, Calendar, Zap } from "lucide-react";
import ShareTripDialog from "@/components/share-trip-dialog";
import TripChat from "@/src/features/chat/TripChat";
import FinalizeModal from "@/src/features/itinerary/FinalizeModal";
import TripSidebar from "@/src/features/chat/TripSidebar";

// ── Types ───────────────────────────────────────────────────────────
interface Trip {
  trip_id: string;
  title: string;
  original_query_id: string | null;
  personalized_itinerary_id: string | null;
  luxury_level: string;
  travel_with: string;
  interests: string[];
  created_at: string;
  status: string;
  user_id: string;
  original_query?: {
    raw_query: string;
    sonar_data?: any;
  };
  itinerary?: {
    title?: string;
    days?: any[];
  };
}

interface Message {
  id: string;
  content: string;
  sender: { id: string; name: string; avatar?: string };
  timestamp: string;
  role: "user" | "assistant";
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: "active" | "pending";
  lastActive?: string;
}

interface Activity {
  id: string;
  type: "message" | "bookmark" | "itinerary" | "join";
  user: { id: string; name: string; avatar?: string };
  content: string;
  timestamp: string;
}

// ── Helpers ─────────────────────────────────────────────────────────
const extractHighlights = (sonarData: any): string[] => {
  const content = sonarData?.choices?.[0]?.message?.content || "";
  const lines = content.split("\n");
  const bullets = lines
    .filter((l) => /^[-*•]\s+/.test(l) || /^\d+\.\s+/.test(l))
    .map((l) => l.replace(/^[-*•]\s+|^\d+\.\s+/, "").trim())
    .slice(0, 8);
  if (bullets.length) return bullets;
  return content
    .split("\n\n")
    .filter((p) => p.length > 50)
    .slice(0, 5)
    .map((p) => p.substring(0, 120) + "…");
};

const extractLinks = (sonarData: any) => {
  return (sonarData?.citations || []).slice(0, 6).map((url: string, i: number) => {
    const domain = new URL(url).hostname.replace("www.", "");
    return {
      title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Resource ${i + 1}`,
      url,
      description: `Research source from ${domain}`,
    };
  });
};

// ── Component ───────────────────────────────────────────────────────
export default function TripDashboardPage() {
  const { id: tripId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripDetails, setTripDetails] = useState<{ highlights: string[]; links: any[] } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [tripBookmarks, setTripBookmarks] = useState<any[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "chat" | "bookmarks" | "itinerary">("overview");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      setError(null);

      try {
        // 1️⃣ Fetch trip
        const { data: t, error: te } = await supabase
          .from<Trip>("trips")
          .select("*")
          .eq("trip_id", tripId)
          .eq("user_id", user.id)
          .single();
        if (te) throw te;
        if (!t) throw new Error("Trip not found");

        // 2️⃣ Fetch original query for highlights/links
        let original_query = null;
        if (t.original_query_id) {
          const { data: q, error: qe } = await supabase
            .from("queries")
            .select("raw_query, sonar_data")
            .eq("id", t.original_query_id)
            .single();
          if (qe) throw qe;
          original_query = q;
        }

        // 3️⃣ Fetch itinerary JSON
        let itinerary = null;
        if (t.personalized_itinerary_id) {
          const { data: it, error: ie } = await supabase
            .from("itineraries")
            .select("sonar_json")
            .eq("id", t.personalized_itinerary_id)
            .single();
          if (ie) throw ie;
          itinerary = it?.sonar_json;
        }

        // 4️⃣ Hydrate trip state
        setTrip({ ...t, original_query, itinerary });

        // 5️⃣ Build tripDetails & messages
        if (original_query?.sonar_data) {
          setTripDetails({
            highlights: extractHighlights(original_query.sonar_data),
            links: extractLinks(original_query.sonar_data),
          });
          setTripBookmarks(extractLinks(original_query.sonar_data));
        }

        setMessages([
          {
            id: "welcome",
            content: `Welcome! How can I help with "${original_query?.raw_query || t.title}"?`,
            sender: { id: "system", name: "Trip Assistant" },
            timestamp: new Date().toISOString(),
            role: "assistant",
          },
        ]);

        setCollaborators([
          {
            id: "1",
            name: "Alex Johnson",
            email: "alex@example.com",
            status: "active",
            lastActive: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          },
        ]);

        setActivities([
          {
            id: "1",
            type: "join",
            user: { id: user.id, name: user.user_metadata?.full_name || user.email },
            content: "started planning this trip",
            timestamp: new Date().toISOString(),
          },
        ]);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [tripId, user]);

  // ── Loading / Error States ────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
      </div>
    );
  }
  if (error || !trip) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Trip not found</h2>
        <p className="text-gray-600 mb-6">We couldn't find that trip.</p>
        <div className="flex justify-center gap-4">
          <Link href="/trips">
            <Button>Back to My Trips</Button>
          </Link>
          <Link href="/discover">
            <Button variant="outline">Start New Trip</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tripTitle = trip.title || trip.original_query?.raw_query || "Your Trip";

  return (
    <div className="container mx-auto px-4 py-12">
      {/* — Header & Actions */}
      <div className="max-w-6xl mx-auto mb-8">
        <Button variant="ghost" onClick={() => router.push("/trips")}>
          <ArrowLeft className="mr-2" />
          Back to My Trips
        </Button>

        <div className="bg-amber-50 p-6 rounded-lg shadow-md mt-4 flex flex-col md:flex-row md:justify-between">
          <h1 className="text-3xl font-bold font-playfair">{tripTitle}</h1>
          <div className="flex gap-2 mt-4 md:mt-0">
            <ShareTripDialog tripId={trip.trip_id} tripTitle={tripTitle} />
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setEnriching(true);
                // … your enrich logic …
                setEnriching(false);
              }}
              disabled={enriching}
            >
              {enriching ? <Loader2 className="animate-spin" /> : <Zap />}
              Enrich Itinerary
            </Button>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <div className="flex items-center"><Sparkles className="mr-1" />{trip.luxury_level}</div>
            <div className="flex items-center"><Users className="mr-1" />{trip.travel_with}</div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            {trip.interests.map((i) => (
              <span key={i} className="px-2 py-1 bg-amber-100 rounded-full text-xs">{i}</span>
            ))}
          </div>
        </div>
      </div>

      {/* — Tabs */}
      <div className="max-w-6xl mx-auto grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
        <Tabs
          value={activeTab}
          onValueChange={(val) => {
          // guard against any unexpected string
          if (["overview", "chat", "bookmarks", "itinerary"].includes(val)) {
              setActiveTab(
              val as "overview" | "chat" | "bookmarks" | "itinerary"
            );
          }
        }}
        className="space-y-6">
      <TabsList className="bg-amber-50 p-1 rounded">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="chat">Chat</TabsTrigger>
        <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
        <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
      </TabsList>

            {/* Overview */}
            <TabsContent value="overview">
              <div className="grid md:grid-cols-3 gap-6">
                {tripDetails?.highlights?.length > 0 && (
                  <Card className="md:col-span-2">
                    <CardHeader><CardTitle>Highlights</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-2">
                        {tripDetails.highlights.map((h, i) => (
                          <li key={i}>{h}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
                {tripDetails?.links?.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Resources</CardTitle></CardHeader>
                    <CardContent>
                      <ul className="space-y-4">
                        {tripDetails.links.map((l, i) => (
                          <li key={i}>
                            <a href={l.url} target="_blank" className="text-blue-600 hover:underline">
                              {l.title}
                            </a>
                            <p className="text-sm text-gray-500">{l.description}</p>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Chat */}
            <TabsContent value="chat">
              <React.Suspense fallback={<div>Loading chat...</div>}>
                <TripChat tripId={trip.trip_id} initialMessages={messages} />
              </React.Suspense>
            </TabsContent>

            {/* Bookmarks */}
            <TabsContent value="bookmarks">
              {/* … your bookmarks UI … */}
            </TabsContent>

            {/* Itinerary */}
            <TabsContent value="itinerary">
              {/* … your itinerary UI, using trip.itinerary … */}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div>
          <TripSidebar
            tripId={trip.trip_id}
            collaborators={collaborators}
            activities={activities}
            onInviteClick={() => {/* … */}}
            onActivityClick={() => {/* … */}}
          />
        </div>
      </div>

      {/* Finalize Modal */}
      <FinalizeModal
        isOpen={showFinalizeModal}
        onClose={() => setShowFinalizeModal(false)}
        tripId={trip.trip_id}
        onItineraryGenerated={(it) => setTrip((t) => t && { ...t, itinerary: it })}
        onNavigateToItinerary={() => setActiveTab("itinerary")}
      />
    </div>
  );
}