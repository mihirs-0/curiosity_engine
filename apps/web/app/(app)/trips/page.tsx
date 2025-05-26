"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Users, Sparkles, Share2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Trip {
  trip_id: string;
  title: string;
  luxury_level: string;
  travel_with: string;
  interests: string[];
  created_at: string;
  status: string;
  user_id: string;
}

export default function TripsPage() {
  // ─── 1. Hooks ──────────────────────────────────────────────────────
  const { user, isLoading: authLoading } = useAuth();
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [sharedTrips, setSharedTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // ─── 2. Fetch trips once auth is settled ──────────────────────────
  useEffect(() => {
    if (authLoading) return; // still figuring out who you are
    setLoading(true);

    const userId = user?.id ?? "demo-user";

    supabase
      .from("trips")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching trips:", error);
          setMyTrips([]);
        } else {
          setMyTrips(data ?? []);
        }
        // placeholder for shared trips logic
        setSharedTrips([]);
      }, (error: Error) => {
        console.error("Unexpected error:", error);
        setMyTrips([]);
        setSharedTrips([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [authLoading, user?.id]);

  // ─── 3. Label helpers ─────────────────────────────────────────────
  const getLuxuryLabel = (level: string) =>
    ({
      budget: "Budget-Friendly",
      moderate: "Moderate",
      luxury: "Luxury",
    }[level] ?? "Moderate");

  const getTravelWithLabel = (type: string) =>
    ({
      solo: "Solo Adventure",
      partner: "With Partner",
      family: "Family Trip",
      friends: "Friend Group",
    }[type] ?? "With Partner");

  // ─── 4. Loading state ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-amber-500" />
      </div>
    );
  }

  // ─── 5. Render grid helper ───────────────────────────────────────
  const renderTripGrid = (trips: Trip[]) =>
    trips.length === 0 ? (
      <div className="text-center py-16 bg-gray-50 rounded-lg">
        <Sparkles className="h-12 w-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No trips yet</h2>
        <p className="text-gray-600 mb-6">
          Start by exploring destinations and finalizing a trip
        </p>
        <Link href="/discover">
          <Button className="bg-gradient-to-r from-amber-500 to-orange-500">
            Discover Destinations
          </Button>
        </Link>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {trips.map((trip) => (
          <Link
            key={trip.trip_id}
            href={`/trips/${trip.trip_id}`}
            className="block"
          >
            <Card className="shadow-md hover:shadow-lg transition">
              <CardHeader className="bg-amber-50">
                <CardTitle>{trip.title}</CardTitle>
                <CardDescription className="flex justify-between text-sm">
                  Created{" "}
                  {formatDistanceToNow(new Date(trip.created_at), {
                    addSuffix: true,
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-amber-500" />
                  {trip.title.split(":")[0]}
                </div>
                <div className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-amber-500" />
                  {getLuxuryLabel(trip.luxury_level)}
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-amber-500" />
                  {getTravelWithLabel(trip.travel_with)}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500">
                  Continue Planning
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))}
      </div>
    );

  // ─── 6. Final render ──────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold font-playfair mb-6 text-center">
        My Trips
      </h1>

      <Tabs defaultValue="my-trips" className="space-y-6">
        <TabsList className="bg-amber-50 p-1 mx-auto flex justify-center">
          <TabsTrigger value="my-trips" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            My Trips
          </TabsTrigger>
          <TabsTrigger value="shared-trips" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Shared with Me
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-trips">{renderTripGrid(myTrips)}</TabsContent>
        <TabsContent value="shared-trips">
          {renderTripGrid(sharedTrips)}
        </TabsContent>
      </Tabs>
    </div>
  );
}