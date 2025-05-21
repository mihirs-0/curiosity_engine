-- users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- queries table
CREATE TABLE public.queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  raw_query text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  trip_start date,
  trip_end date,
  created_at timestamp with time zone DEFAULT now()
);

-- itineraries table
CREATE TABLE public.itineraries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query_id uuid REFERENCES public.queries(id) ON DELETE CASCADE,
  theme text NOT NULL,
  sonar_json jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- updates table
CREATE TABLE public.updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  itinerary_id uuid REFERENCES public.itineraries(id) ON DELETE CASCADE,
  update_type text NOT NULL,
  payload_json jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now()
); 