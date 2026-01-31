import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useOrders, useOrderOffers } from '@/hooks/useClientData';
import { Card3D } from '@/components/ui/Card3D';
import { Button3D, FloatingActionButton } from '@/components/ui/Button3D';
import { Input3D, Select3D } from '@/components/ui/Input3D';
import { NewRequestModal } from '@/components/modals/NewRequestModal';
import { OrderDetailsModal } from '@/components/modals/OrderDetailsModal';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Plus,
  Search,
  Filter,
  Eye,
  MapPin,
  Truck,
  Star,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Requests() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedOrderId = searchParams.get('id');
  
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [showOrderDetails, setShowOrderDetails] = useState(!!selectedOrderId);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filters, setFilters] = useState({
    status: '',
    truck_type: '',
    search: '',
  });

  const { data: orders, isLoading } = useOrders();

  const filteredOrders = orders?.filter((order: any) => {
    if (filters.status && order.status !== filters.status) return false;
    if (filters.truck_type && order.truck_type !== filters.truck_type) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (
        !order.from_location.toLowerCase().includes(search) &&
        !order.to_location.toLowerCase().includes(search) &&
        !order.id.toLowerCase().includes(search)
      ) {
        return false;
      }
    }
    return true;
  }) || [];

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'pending', label: t('status.pending') },
    { value: 'offers_received', label: t('status.offers_received') },
    { value: 'accepted', label: t('status.accepted') },
    { value: 'in_progress', label: t('status.in_progress') },
    { value: 'completed', label: t('status.completed') },
  ];

  const truckTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'flatbed', label: t('truck.flatbed') },
    { value: 'refrigerated', label: t('truck.refrigerated') },
    { value: 'tanker', label: t('truck.tanker') },
    { value: 'container', label: t('truck.container') },
    { value: 'lowboy', label: t('truck.lowboy') },
    { value: 'dry_van', label: t('truck.dry_van') },
  ];

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

  const handleViewDetails = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    navigate(`/requests?id=${order.id}`, { replace: true });
  };

  const handleCloseDetails = () => {
    setShowOrderDetails(false);
    setSelectedOrder(null);
    navigate('/requests', { replace: true });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="font-display text-3xl font-bold gradient-text">
          {t('requests.title')}
        </h1>
        <Button3D
          onClick={() => setShowNewRequest(true)}
          icon={<Plus className="w-5 h-5" />}
        >
          {t('requests.createNew')}
        </Button3D>
      </div>

      {/* Filters */}
      <Card3D variant="panel" className="animate-slide-up">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <Input3D
              icon={<Search className="w-5 h-5" />}
              placeholder="Search by location or ID..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
          <div className="flex gap-4">
            <Select3D
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={statusOptions}
              className="min-w-[150px]"
            />
            <Select3D
              value={filters.truck_type}
              onChange={(e) => setFilters({ ...filters, truck_type: e.target.value })}
              options={truckTypeOptions}
              className="min-w-[150px]"
            />
          </div>
        </div>
      </Card3D>

      {/* Orders Table */}
      <Card3D variant="panel" className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">{t('common.noData')}</p>
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
                  <th>Date</th>
                  <th>{t('requests.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order: any) => (
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
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-muted-foreground" />
                        <span className="capitalize">{t(`truck.${order.truck_type}`)}</span>
                      </div>
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {order.order_offers?.[0]?.count || 0}
                      </span>
                    </td>
                    <td className="text-muted-foreground text-sm">
                      {format(new Date(order.created_at), 'MMM d, yyyy')}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button3D
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          icon={<Eye className="w-4 h-4" />}
                        >
                          {t('requests.viewDetails')}
                        </Button3D>
                        {(order.status === 'in_progress' || order.status === 'accepted') && (
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

      {/* FAB for mobile */}
      <FloatingActionButton
        icon={<Plus className="w-6 h-6" />}
        onClick={() => setShowNewRequest(true)}
        className="lg:hidden"
      />

      {/* Modals */}
      <NewRequestModal
        open={showNewRequest}
        onClose={() => setShowNewRequest(false)}
      />
      
      {selectedOrder && (
        <OrderDetailsModal
          open={showOrderDetails}
          onClose={handleCloseDetails}
          order={selectedOrder}
        />
      )}
    </div>
  );
}
