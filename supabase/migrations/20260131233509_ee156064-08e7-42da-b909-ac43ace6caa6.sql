-- Create enum types
CREATE TYPE public.order_status AS ENUM ('pending', 'offers_received', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.truck_type AS ENUM ('flatbed', 'refrigerated', 'tanker', 'container', 'lowboy', 'dry_van');
CREATE TYPE public.offer_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE public.trip_status AS ENUM ('assigned', 'en_route_pickup', 'at_pickup', 'loaded', 'in_transit', 'at_delivery', 'completed', 'cancelled');

-- Clients/Companies table
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    company_name_ar TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(user_id)
);

-- Drivers table
CREATE TABLE public.drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_ar TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    truck_type truck_type NOT NULL,
    truck_plate TEXT NOT NULL,
    manufacturing_year INTEGER NOT NULL,
    rating DECIMAL(2,1) DEFAULT 5.0,
    total_trips INTEGER DEFAULT 0,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    from_location TEXT NOT NULL,
    from_location_ar TEXT,
    to_location TEXT NOT NULL,
    to_location_ar TEXT,
    from_lat DECIMAL(10,8),
    from_lng DECIMAL(11,8),
    to_lat DECIMAL(10,8),
    to_lng DECIMAL(11,8),
    truck_type truck_type NOT NULL,
    required_trucks_count INTEGER DEFAULT 1,
    min_manufacturing_year INTEGER,
    notes TEXT,
    status order_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Order offers from drivers
CREATE TABLE public.order_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
    offered_price DECIMAL(10,2) NOT NULL,
    estimated_hours INTEGER,
    notes TEXT,
    status offer_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Trip executions (active shipments)
CREATE TABLE public.trip_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    offer_id UUID REFERENCES public.order_offers(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
    status trip_status DEFAULT 'assigned' NOT NULL,
    progress_percentage INTEGER DEFAULT 0,
    current_lat DECIMAL(10,8),
    current_lng DECIMAL(11,8),
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Driver locations for real-time tracking
CREATE TABLE public.driver_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
    trip_id UUID REFERENCES public.trip_executions(id) ON DELETE CASCADE,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    heading DECIMAL(5,2),
    speed DECIMAL(6,2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Invoices
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Ratings
CREATE TABLE public.ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.drivers(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Helper function to get client_id for current user
CREATE OR REPLACE FUNCTION public.get_current_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clients WHERE user_id = auth.uid()
$$;

-- RLS Policies for clients
CREATE POLICY "Users can view their own client profile"
ON public.clients FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own client profile"
ON public.clients FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own client profile"
ON public.clients FOR UPDATE
USING (user_id = auth.uid());

-- RLS Policies for drivers (clients can view all drivers)
CREATE POLICY "Authenticated users can view drivers"
ON public.drivers FOR SELECT
TO authenticated
USING (true);

-- RLS Policies for orders
CREATE POLICY "Clients can view their own orders"
ON public.orders FOR SELECT
USING (client_id = public.get_current_client_id());

CREATE POLICY "Clients can insert their own orders"
ON public.orders FOR INSERT
WITH CHECK (client_id = public.get_current_client_id());

CREATE POLICY "Clients can update their own orders"
ON public.orders FOR UPDATE
USING (client_id = public.get_current_client_id());

-- RLS Policies for order_offers
CREATE POLICY "Clients can view offers on their orders"
ON public.order_offers FOR SELECT
USING (order_id IN (SELECT id FROM public.orders WHERE client_id = public.get_current_client_id()));

CREATE POLICY "Clients can update offers on their orders"
ON public.order_offers FOR UPDATE
USING (order_id IN (SELECT id FROM public.orders WHERE client_id = public.get_current_client_id()));

-- RLS Policies for trip_executions
CREATE POLICY "Clients can view their trip executions"
ON public.trip_executions FOR SELECT
USING (order_id IN (SELECT id FROM public.orders WHERE client_id = public.get_current_client_id()));

-- RLS Policies for driver_locations
CREATE POLICY "Clients can view locations for their trips"
ON public.driver_locations FOR SELECT
USING (trip_id IN (
  SELECT te.id FROM public.trip_executions te
  JOIN public.orders o ON te.order_id = o.id
  WHERE o.client_id = public.get_current_client_id()
));

-- RLS Policies for invoices
CREATE POLICY "Clients can view their own invoices"
ON public.invoices FOR SELECT
USING (client_id = public.get_current_client_id());

-- RLS Policies for ratings
CREATE POLICY "Clients can view their own ratings"
ON public.ratings FOR SELECT
USING (client_id = public.get_current_client_id());

CREATE POLICY "Clients can insert ratings"
ON public.ratings FOR INSERT
WITH CHECK (client_id = public.get_current_client_id());

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_executions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON public.drivers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_offers_updated_at BEFORE UPDATE ON public.order_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trip_executions_updated_at BEFORE UPDATE ON public.trip_executions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();