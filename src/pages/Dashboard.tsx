import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useDashboardStats, useOrders } from '@/hooks/useClientData';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { StatCard, Card3D } from '@/components/ui/Card3D';
import { Button3D, FloatingActionButton } from '@/components/ui/Button3D';
import { NewRequestModal } from '@/components/modals/NewRequestModal';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Truck,
  Clock,
  CheckCircle,
  DollarSign,
  Timer,
  Users,
  Plus,
  Eye,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showNewRequest, setShowNewRequest] = useState(false);
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: orders, isLoading: ordersLoading } = useOrders();

  // Realtime subscriptions
  useRealtimeSubscription({
    table: 'orders',
    onInsert: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onUpdate: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });

  useRealtimeSubscription({
    table: 'order_offers',
    onInsert: (payload) => {
      toast.info('New offer received!', {
        description: 'A driver has submitted an offer for your request.',
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const recentOrders = orders?.slice(0, 5) || [];

  const getStatusBadge = (status: string) => {
    const statusClasses: Record<string, string> = {
      pending: 'badge-pending',
      offers_received: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      accepted: 'badge-active',
      in_progress: 'badge-active',
      completed: 'badge-completed',
      cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return (
      <span className={cn('badge-status', statusClasses[status] || 'badge-pending')}>
        {t(`status.${status}`)}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold gradient-text">
            {t('overview.title')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        <Button3D
          onClick={() => setShowNewRequest(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          {t('overview.newRequest')}
        </Button3D>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title={t('overview.activeShipments')}
          value={statsLoading ? '-' : stats?.activeShipments || 0}
          icon={<Truck className="w-6 h-6" />}
          className="animate-slide-up"
        />
        <StatCard
          title={t('overview.pendingRequests')}
          value={statsLoading ? '-' : stats?.pendingRequests || 0}
          icon={<Clock className="w-6 h-6" />}
          className="animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        />
        <StatCard
          title={t('overview.acceptedToday')}
          value={statsLoading ? '-' : stats?.acceptedToday || 0}
          icon={<CheckCircle className="w-6 h-6" />}
          className="animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        />
        <StatCard
          title={t('overview.estimatedCost')}
          value={statsLoading ? '-' : stats?.estimatedCost?.toLocaleString() || 0}
          icon={<DollarSign className="w-6 h-6" />}
          suffix={t('common.sar')}
          className="animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        />
        <StatCard
          title={t('overview.avgDeliveryTime')}
          value={statsLoading ? '-' : stats?.avgDeliveryTime || 0}
          icon={<Timer className="w-6 h-6" />}
          suffix={t('overview.hours')}
          className="animate-slide-up"
          style={{ animationDelay: '0.4s' }}
        />
        <StatCard
          title={t('overview.activeTrucks')}
          value={statsLoading ? '-' : stats?.activeTrucks || 0}
          icon={<Users className="w-6 h-6" />}
          className="animate-slide-up"
          style={{ animationDelay: '0.5s' }}
        />
      </div>

      {/* Recent Requests Table */}
      <Card3D variant="panel" className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">
            {t('overview.recentRequests')}
          </h2>
          <Button3D
            variant="ghost"
            size="sm"
            onClick={() => navigate('/requests')}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            View All
          </Button3D>
        </div>

        {ordersLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">{t('common.noData')}</p>
            <Button3D
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setShowNewRequest(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              Create Your First Request
            </Button3D>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-grid w-full">
              <thead>
                <tr>
                  <th>{t('requests.id')}</th>
                  <th>{t('requests.from')} / {t('requests.to')}</th>
                  <th>{t('requests.truckType')}</th>
                  <th>{t('requests.status')}</th>
                  <th>{t('requests.offers')}</th>
                  <th>{t('requests.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="group">
                    <td className="font-mono text-sm text-primary">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        <div>
                          <div className="font-medium">{order.from_location}</div>
                          <div className="text-xs text-muted-foreground">→ {order.to_location}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="capitalize">{t(`truck.${order.truck_type}`)}</span>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
                        {order.order_offers?.[0]?.count || 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button3D
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/requests?id=${order.id}`)}
                          icon={<Eye className="w-4 h-4" />}
                        >
                          {t('requests.viewDetails')}
                        </Button3D>
                        {order.status === 'in_progress' && (
                          <Button3D
                            variant="accent"
                            size="sm"
                            onClick={() => navigate(`/tracking?id=${order.id}`)}
                            icon={<MapPin className="w-4 h-4" />}
                          >
                            {t('requests.track')}
                          </Button3D>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card3D>

      {/* Floating Action Button */}
      <FloatingActionButton
        icon={<Plus className="w-6 h-6" />}
        onClick={() => setShowNewRequest(true)}
        className="lg:hidden"
      />

      {/* New Request Modal */}
      <NewRequestModal
        open={showNewRequest}
        onClose={() => setShowNewRequest(false)}
      />
    </div>
  );
}
