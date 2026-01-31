import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card3D } from '@/components/ui/Card3D';
import { Button3D } from '@/components/ui/Button3D';
import { useI18n } from '@/lib/i18n';
import { useOrderOffers } from '@/hooks/useClientData';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  MapPin,
  Truck,
  Calendar,
  DollarSign,
  Star,
  Check,
  User,
  Clock,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface OrderDetailsModalProps {
  open: boolean;
  onClose: () => void;
  order: any;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  open,
  onClose,
  order,
}) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [acceptingOfferId, setAcceptingOfferId] = useState<string | null>(null);
  
  const { data: offers, isLoading } = useOrderOffers(order?.id);

  const handleAcceptOffer = async (offer: any) => {
    setAcceptingOfferId(offer.id);
    
    try {
      // Update offer status to accepted
      const { error: offerError } = await supabase
        .from('order_offers')
        .update({ status: 'accepted' })
        .eq('id', offer.id);

      if (offerError) throw offerError;

      // Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ status: 'accepted' })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // Create trip execution
      const { error: tripError } = await supabase
        .from('trip_executions')
        .insert({
          order_id: order.id,
          offer_id: offer.id,
          driver_id: offer.driver_id,
          status: 'assigned',
          progress_percentage: 0,
        });

      if (tripError) throw tripError;

      // Create invoice
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          order_id: order.id,
          client_id: order.client_id,
          amount: offer.offered_price,
          status: 'pending',
        });

      if (invoiceError) throw invoiceError;

      // Reject other offers
      await supabase
        .from('order_offers')
        .update({ status: 'rejected' })
        .eq('order_id', order.id)
        .neq('id', offer.id);

      toast.success('Offer accepted! Driver has been assigned.');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-offers', order.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['active-shipments'] });
      
      onClose();
      navigate(`/tracking?id=${order.id}`);
    } catch (error) {
      toast.error('Failed to accept offer');
    } finally {
      setAcceptingOfferId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400';
      case 'offers_received': return 'text-blue-400';
      case 'accepted': return 'text-primary';
      case 'in_progress': return 'text-primary';
      case 'completed': return 'text-accent';
      default: return 'text-muted-foreground';
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="modal-3d max-w-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display text-2xl font-bold gradient-text flex items-center gap-3">
            <FileText className="w-6 h-6" />
            Request #{order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          {/* Order Details */}
          <div className="grid grid-cols-2 gap-4">
            <Card3D className="p-4 bg-muted/30">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">{t('requests.from')}</span>
              </div>
              <p className="font-semibold">{order.from_location}</p>
            </Card3D>
            
            <Card3D className="p-4 bg-muted/30">
              <div className="flex items-center gap-3 mb-2">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="text-sm text-muted-foreground">{t('requests.to')}</span>
              </div>
              <p className="font-semibold">{order.to_location}</p>
            </Card3D>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t('requests.truckType')}</p>
                <p className="font-medium capitalize">{t(`truck.${order.truck_type}`)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">{t('requests.status')}</p>
                <p className={cn("font-medium capitalize", getStatusColor(order.status))}>
                  {t(`status.${order.status}`)}
                </p>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <p className="text-sm text-muted-foreground mb-1">{t('form.notes')}</p>
              <p>{order.notes}</p>
            </div>
          )}

          {/* Offers Section */}
          <div>
            <h3 className="font-display text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Offers ({offers?.length || 0})
            </h3>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {t('common.loading')}
              </div>
            ) : offers?.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground">No offers yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drivers will submit offers soon
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {offers?.map((offer: any) => (
                  <Card3D
                    key={offer.id}
                    className={cn(
                      "p-4 transition-all",
                      offer.status === 'accepted' && "border-accent/50 bg-accent/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{offer.drivers?.name || 'Driver'}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Truck className="w-4 h-4" />
                              {offer.drivers?.truck_plate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400" />
                              {offer.drivers?.rating || 5.0}
                            </span>
                            <span>{offer.drivers?.manufacturing_year}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary font-display">
                          {Number(offer.offered_price).toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">{t('common.sar')}</p>
                      </div>
                    </div>
                    
                    {offer.notes && (
                      <p className="mt-3 text-sm text-muted-foreground p-2 rounded bg-muted/30">
                        {offer.notes}
                      </p>
                    )}
                    
                    {offer.status === 'pending' && order.status === 'pending' && (
                      <div className="mt-4 flex justify-end">
                        <Button3D
                          variant="accent"
                          size="sm"
                          onClick={() => handleAcceptOffer(offer)}
                          isLoading={acceptingOfferId === offer.id}
                          icon={<Check className="w-4 h-4" />}
                        >
                          Accept Offer
                        </Button3D>
                      </div>
                    )}
                    
                    {offer.status === 'accepted' && (
                      <div className="mt-4 flex items-center justify-between">
                        <span className="badge-status badge-completed">
                          <Check className="w-4 h-4 mr-1" />
                          Accepted
                        </span>
                        <Button3D
                          variant="primary"
                          size="sm"
                          onClick={() => {
                            onClose();
                            navigate(`/tracking?id=${order.id}`);
                          }}
                          icon={<MapPin className="w-4 h-4" />}
                        >
                          Track Shipment
                        </Button3D>
                      </div>
                    )}
                  </Card3D>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
