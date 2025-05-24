-- Create chat_message table
CREATE TABLE public.chat_message (
  id serial PRIMARY KEY,
  trip_id text NOT NULL,
  user_id text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create itinerary_choice table
CREATE TABLE public.itinerary_choice (
  id serial PRIMARY KEY,
  trip_id text NOT NULL,
  user_id text NOT NULL,
  message_id integer NOT NULL REFERENCES public.chat_message(id) ON DELETE CASCADE,
  payload jsonb NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_chat_message_trip_id ON public.chat_message(trip_id);
CREATE INDEX idx_chat_message_user_id ON public.chat_message(user_id);
CREATE INDEX idx_itinerary_choice_trip_id ON public.itinerary_choice(trip_id);
CREATE INDEX idx_itinerary_choice_user_id ON public.itinerary_choice(user_id);
CREATE INDEX idx_itinerary_choice_message_id ON public.itinerary_choice(message_id);
