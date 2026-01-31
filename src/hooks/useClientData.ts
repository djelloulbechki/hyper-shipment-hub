import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useClientProfile() {
  return useQuery({
    queryKey: ['client-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
  });
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_offers(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useActiveShipments() {
  return useQuery({
    queryKey: ['active-shipments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_executions')
        .select(`
          *,
          orders(*),
          drivers(*),
          order_offers(*)
        `)
        .in('status', ['assigned', 'en_route_pickup', 'at_pickup', 'loaded', 'in_transit', 'at_delivery'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useInvoices() {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          orders(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useDriverRatings() {
  return useQuery({
    queryKey: ['driver-ratings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          *,
          drivers(*),
          orders(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useDriversWorkedWith() {
  return useQuery({
    queryKey: ['drivers-worked-with'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Active shipments count
      const { count: activeShipments } = await supabase
        .from('trip_executions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['assigned', 'en_route_pickup', 'at_pickup', 'loaded', 'in_transit', 'at_delivery']);

      // Pending requests count
      const { count: pendingRequests } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Accepted today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: acceptedToday } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')
        .gte('updated_at', today.toISOString());

      // Estimated cost from accepted offers
      const { data: acceptedOffers } = await supabase
        .from('order_offers')
        .select('offered_price')
        .eq('status', 'accepted');

      const estimatedCost = acceptedOffers?.reduce((sum, offer) => sum + Number(offer.offered_price), 0) || 0;

      // Active trucks count (unique drivers with active trips)
      const { data: activeTrips } = await supabase
        .from('trip_executions')
        .select('driver_id')
        .in('status', ['assigned', 'en_route_pickup', 'at_pickup', 'loaded', 'in_transit', 'at_delivery']);

      const activeTrucks = new Set(activeTrips?.map(t => t.driver_id)).size;

      // Average delivery time (mock for now - would calculate from completed trips)
      const avgDeliveryTime = 4.5;

      return {
        activeShipments: activeShipments || 0,
        pendingRequests: pendingRequests || 0,
        acceptedToday: acceptedToday || 0,
        estimatedCost,
        avgDeliveryTime,
        activeTrucks,
      };
    },
  });
}

export function useOrderOffers(orderId: string) {
  return useQuery({
    queryKey: ['order-offers', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('order_offers')
        .select(`
          *,
          drivers(*)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}
