import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useActiveShipments } from '@/hooks/useClientData';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Card3D } from '@/components/ui/Card3D';
import { Button3D } from '@/components/ui/Button3D';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Truck,
  MapPin,
  User,
  Clock,
  Navigation,
  Activity,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

export default function Tracking() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: shipments, isLoading } = useActiveShipments();

  // Realtime subscriptions for live tracking
  useRealtimeSubscription({
    table: 'trip_executions',
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shipments'] });
    },
  });

  useRealtimeSubscription({
    table: 'driver_locations',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shipments'] });
    },
  });

  const getTripStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      assigned: 'Assigned',
      en_route_pickup: 'En Route to Pickup',
      at_pickup: 'At Pickup Location',
      loaded: 'Loaded',
      in_transit: 'In Transit',
      at_delivery: 'At Delivery Location',
      completed: 'Completed',
    };
    return labels[status] || status;
  };

  const getTripStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      en_route_pickup: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      at_pickup: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      loaded: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      in_transit: 'bg-primary/20 text-primary border-primary/30',
      at_delivery: 'bg-accent/20 text-accent border-accent/30',
      completed: 'bg-accent/20 text-accent border-accent/30',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">
          {t('tracking.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your shipments in real-time
        </p>
      </div>

      {/* Active Shipments */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">
          {t('common.loading')}
        </div>
      ) : shipments?.length === 0 ? (
        <Card3D variant="panel" className="text-center py-16">
          <Truck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-display text-xl font-bold mb-2">No Active Shipments</h3>
          <p className="text-muted-foreground">
            Accept an offer to start tracking your shipment
          </p>
        </Card3D>
      ) : (
        <div className="grid gap-6">
          {shipments?.map((shipment: any) => (
            <Card3D key={shipment.id} variant="panel" className="animate-slide-up">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Left: Driver Info */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                      <Activity className="w-3 h-3 text-accent-foreground" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{shipment.drivers?.name || 'Driver'}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        {shipment.drivers?.truck_plate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        {shipment.drivers?.rating || 5.0}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Center: Route & Progress */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{shipment.orders?.from_location}</span>
                    </div>
                    <div className="flex-1 mx-4 h-px bg-gradient-to-r from-primary to-accent" />
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <span className="font-medium">{shipment.orders?.to_location}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('tracking.progress')}</span>
                      <span className="font-semibold text-primary">
                        {shipment.progress_percentage || 0}%
                      </span>
                    </div>
                    <div className="progress-glow">
                      <div
                        className="progress-glow-bar"
                        style={{ width: `${shipment.progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Status & Actions */}
                <div className="flex flex-col items-end gap-3">
                  <span className={cn(
                    "badge-status",
                    getTripStatusColor(shipment.status)
                  )}>
                    <Navigation className="w-4 h-4 mr-1" />
                    {getTripStatusLabel(shipment.status)}
                  </span>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {shipment.actual_start_time
                          ? `Started ${format(new Date(shipment.actual_start_time), 'HH:mm')}`
                          : 'Not started'}
                      </span>
                    </div>
                    {shipment.estimated_arrival && (
                      <p className="text-sm mt-1">
                        <span className="text-muted-foreground">ETA: </span>
                        <span className="font-semibold text-accent">
                          {format(new Date(shipment.estimated_arrival), 'HH:mm')}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Order #{shipment.orders?.id?.slice(0, 8)}</span>
                  <span>•</span>
                  <span className="capitalize">{shipment.orders?.truck_type}</span>
                  <span>•</span>
                  <span>
                    {shipment.order_offers?.offered_price?.toLocaleString()} {t('common.sar')}
                  </span>
                </div>
                
                <Button3D
                  variant="outline"
                  size="sm"
                  icon={<MapPin className="w-4 h-4" />}
                  onClick={() => {
                    // In a real app, this would open a map modal
                    console.log('Open map tracking for', shipment.id);
                  }}
                >
                  {t('tracking.trackLive')}
                </Button3D>
              </div>
            </Card3D>
          ))}
        </div>
      )}
    </div>
  );
}
