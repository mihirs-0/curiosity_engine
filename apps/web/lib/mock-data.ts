export interface Query {
  id: string
  text: string
  source: "manual" | "clipped"
  timestamp: string
  status?: "pending" | "completed"
}

export const mockQueries: Query[] = [
  {
    id: "q1",
    text: "I want to explore Greek islands for 10 days in summer",
    source: "manual",
    timestamp: "2023-06-15T10:30:00Z",
    status: "completed",
  },
  {
    id: "q2",
    text: "Weekend getaway to Santorini with my partner",
    source: "clipped",
    timestamp: "2023-07-22T14:45:00Z",
    status: "completed",
  },
  {
    id: "q3",
    text: "Family-friendly activities in Athens for a week",
    source: "manual",
    timestamp: "2023-08-05T09:15:00Z",
    status: "completed",
  },
  {
    id: "q4",
    text: "Best restaurants in Mykonos with ocean views",
    source: "clipped",
    timestamp: "2023-08-10T16:20:00Z",
    status: "pending",
  },
  {
    id: "q5",
    text: "Historical sites tour in Crete and surrounding islands",
    source: "manual",
    timestamp: "2023-08-18T11:05:00Z",
    status: "pending",
  },
]

export interface SonarResult {
  id: string
  title: string
  highlights?: string[]
  links?: {
    title: string
    url: string
    description: string
  }[]
}

export const mockResults: Record<string, SonarResult> = {
  q1: {
    id: "q1",
    title: "Greek Island Hopping: 10-Day Summer Adventure",
    highlights: [
      "Best time to visit is June to September for warm weather and minimal rainfall",
      "Island hopping ferry passes start at €60 for 3 islands",
      "Santorini, Mykonos, and Naxos form the classic first-timer's route",
      "Book accommodations 3-4 months in advance for high season",
      "Budget approximately €100-150 per day for mid-range travel",
      "Most islands have reliable ferry connections running multiple times daily",
      "Consider less touristy islands like Milos or Folegandros for authentic experiences",
    ],
    links: [
      {
        title: "Ferry Schedules & Booking",
        url: "https://www.ferryhopper.com",
        description: "Complete ferry schedules and online booking for Greek islands",
      },
      {
        title: "Island Hopping Guide",
        url: "https://www.greeka.com/greek-islands/island-hopping/",
        description: "Comprehensive guide to planning Greek island hopping routes",
      },
      {
        title: "Accommodation Comparison",
        url: "https://www.booking.com/island-hopping-greece",
        description: "Compare hotels and apartments across multiple Greek islands",
      },
      {
        title: "Local Experiences",
        url: "https://www.getyourguide.com/greece",
        description: "Book tours, activities and authentic experiences on Greek islands",
      },
    ],
  },
  q2: {
    id: "q2",
    title: "Romantic Weekend in Santorini",
    highlights: [
      "Best areas for couples: Oia, Imerovigli, and Firostefani for caldera views",
      "Sunset dinner reservations should be made 1-2 weeks in advance",
      "Private catamaran tours around the caldera start at €150 per person",
      "Visit Santo Wines for wine tasting with panoramic views",
      "Ammoudi Bay offers romantic seafood dining by the water",
      "Consider a couples' spa treatment with caldera views",
      "Book a photography session to capture memories against iconic backdrops",
    ],
    links: [
      {
        title: "Romantic Accommodations",
        url: "https://www.booking.com/santorini-couples",
        description: "Curated selection of romantic hotels and suites in Santorini",
      },
      {
        title: "Sunset Cruise Booking",
        url: "https://www.santorini-view.com/cruises",
        description: "Private and small group sunset cruises around Santorini",
      },
      {
        title: "Restaurant Reservations",
        url: "https://www.thefork.com/santorini",
        description: "Book tables at Santorini's most romantic restaurants",
      },
    ],
  },
  q3: {
    id: "q3",
    title: "Family-Friendly Athens: One Week Itinerary",
    highlights: [
      "The Acropolis offers family tickets and is best visited early morning to avoid crowds",
      "The Hellenic Children's Museum has interactive exhibits for ages 4-12",
      "Stavros Niarchos Foundation Cultural Center has free family activities and a great park",
      "The Athens Happy Train is a fun way to see the city with young children",
      "National Garden offers shaded walks and a small zoo perfect for kids",
      "Many tavernas are family-friendly with special menus for children",
      "The Athens Riviera beaches are easily accessible by tram for family beach days",
    ],
    links: [
      {
        title: "Skip-the-line Acropolis Tickets",
        url: "https://www.gettyourguide.com/athens/acropolis-tickets",
        description: "Family tickets with priority access to the Acropolis",
      },
      {
        title: "Family-Friendly Tours",
        url: "https://www.kidslovegreece.com/athens",
        description: "Specialized tours designed for families with children",
      },
      {
        title: "Family Accommodation",
        url: "https://www.booking.com/athens-family",
        description: "Hotels and apartments suitable for families in Athens",
      },
    ],
  },
  q4: {
    id: "q4",
    title: "Mykonos Restaurants with Ocean Views",
    highlights: [
      "Spilia Seaside Restaurant offers dining in a natural sea cave",
      "Hippie Fish combines beachfront dining with fresh seafood on Agios Ioannis Beach",
      "Kiki's Tavern near Agios Sostis beach has no electricity but amazing grilled dishes",
      "Nammos on Psarou Beach is famous for celebrity sightings and Mediterranean cuisine",
      "Scorpios combines dining, music, and sunset views on Paraga Beach",
      "Reservations are essential during high season (June-September)",
      "Many restaurants offer free shuttle services from Mykonos Town",
    ],
    links: [
      {
        title: "Restaurant Reservations",
        url: "https://www.thefork.com/mykonos",
        description: "Book tables at Mykonos' most popular oceanfront restaurants",
      },
      {
        title: "Mykonos Beach Guide",
        url: "https://www.greeka.com/cyclades/mykonos/beaches/",
        description: "Comprehensive guide to beaches with the best restaurant options",
      },
      {
        title: "Culinary Experiences",
        url: "https://www.mykonos-tours.com/food",
        description: "Food tours and cooking classes featuring local cuisine",
      },
    ],
  },
  q5: {
    id: "q5",
    title: "Historical Sites in Crete and Surrounding Islands",
    highlights: [
      "Knossos Palace near Heraklion is the most important Minoan archaeological site",
      "Spinalonga Island has a well-preserved Venetian fortress and former leper colony",
      "Phaistos Disc was discovered at the Minoan Palace of Phaistos in southern Crete",
      "Ancient Aptera offers Roman cisterns, a Greek theater, and stunning views",
      "Delos Island near Mykonos is a UNESCO World Heritage site with extensive ruins",
      "Akrotiri on Santorini is a remarkably preserved Bronze Age settlement",
      "The Archaeological Museum of Heraklion houses the finest collection of Minoan artifacts",
    ],
    links: [
      {
        title: "Knossos Skip-the-line Tickets",
        url: "https://www.gettyourguide.com/heraklion/knossos-palace",
        description: "Priority access tickets and guided tours of Knossos Palace",
      },
      {
        title: "Historical Sites Map",
        url: "https://www.interkriti.org/crete/archaeology/",
        description: "Interactive map of archaeological sites across Crete",
      },
      {
        title: "Island Hopping Archaeological Tour",
        url: "https://www.viator.com/greek-islands-archaeology",
        description: "Multi-island tour focusing on historical sites in the Aegean",
      },
      {
        title: "Museum Passes",
        url: "https://www.culture.gov.gr/en/museum-passes",
        description: "Combined tickets for multiple archaeological sites and museums",
      },
    ],
  },
}

// Add the missing mockResult export
export const mockResult = {
  title: "Greek Island Hopping: 10-Day Summer Adventure",
  description: "Discover the best of the Greek islands with this comprehensive itinerary.",
  suggestedPlaces: [
    {
      name: "Santorini",
      description: "Famous for its stunning caldera views and white-washed buildings.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      name: "Mykonos",
      description: "Known for beautiful beaches and vibrant nightlife.",
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      name: "Naxos",
      description: "The largest of the Cyclades with beautiful beaches and mountain villages.",
      image: "/placeholder.svg?height=200&width=300",
    },
  ],
  mapSection: {
    title: "Island Hopping Route",
    description: "Suggested route for your 10-day adventure.",
  },
  foodSection: {
    highlights: [
      "Fresh seafood caught daily by local fishermen",
      "Traditional Greek mezze including tzatziki, fava, and dolmades",
      "Local wines from volcanic soil in Santorini",
      "Authentic Greek yogurt with honey and nuts",
      "Wood-fired souvlaki and gyros from family-run tavernas",
    ],
    recommendations: [
      {
        name: "Selene",
        cuisine: "Modern Greek",
        priceRange: "€€€",
      },
      {
        name: "Metaxi Mas",
        cuisine: "Traditional Greek",
        priceRange: "€€",
      },
      {
        name: "Dimitris Taverna",
        cuisine: "Seafood",
        priceRange: "€€",
      },
      {
        name: "Kiki's Tavern",
        cuisine: "Grilled Meats",
        priceRange: "€",
      },
    ],
  },
  activities: [
    {
      name: "Sunset Sailing Tour",
      duration: "5 hours",
      description: "Sail around the caldera of Santorini, stopping at hot springs and watching the famous sunset.",
    },
    {
      name: "Ancient Akrotiri Exploration",
      duration: "3 hours",
      description: "Discover the prehistoric settlement of Akrotiri, preserved by volcanic ash.",
    },
    {
      name: "Beach Hopping in Mykonos",
      duration: "Full day",
      description: "Visit the famous beaches of Mykonos, from party spots to secluded coves.",
    },
    {
      name: "Hiking the Naxos Villages",
      duration: "6 hours",
      description: "Trek through traditional mountain villages and ancient marble quarries.",
    },
  ],
  accommodation: {
    suggestions: [
      {
        name: "Canaves Oia Suites",
        type: "Luxury Hotel",
        priceRange: "€€€€",
      },
      {
        name: "Nissaki Beach Hotel",
        type: "Boutique Hotel",
        priceRange: "€€€",
      },
      {
        name: "Pension Sofi",
        type: "Guesthouse",
        priceRange: "€",
      },
    ],
  },
}
