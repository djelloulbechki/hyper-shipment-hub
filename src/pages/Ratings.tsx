import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useDriverRatings, useDriversWorkedWith, useClientProfile } from '@/hooks/useClientData';
import { Card3D } from '@/components/ui/Card3D';
import { Button3D } from '@/components/ui/Button3D';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TextArea3D } from '@/components/ui/Input3D';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Star,
  User,
  Truck,
  MessageSquare,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Ratings() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const { data: client } = useClientProfile();
  const { data: ratings, isLoading } = useDriverRatings();
  const { data: drivers } = useDriversWorkedWith();
  
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleOpenRating = (driver: any) => {
    setSelectedDriver(driver);
    setRating(5);
    setComment('');
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!client?.id || !selectedDriver?.id) return;
    
    setSubmitting(true);
    try {
      // For demo, we'll just insert a rating without an order_id
      // In a real app, you'd select which order to rate
      const { error } = await supabase.from('ratings').insert({
        client_id: client.id,
        driver_id: selectedDriver.id,
        order_id: ratings?.[0]?.order_id || selectedDriver.id, // Fallback
        rating,
        comment: comment || null,
      });

      if (error) throw error;

      toast.success('Rating submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['driver-ratings'] });
      queryClient.invalidateQueries({ queryKey: ['drivers-worked-with'] });
      setShowRatingModal(false);
    } catch (error) {
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive = false, size = 'md') => {
    const sizeClasses = size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses,
              "transition-all",
              star <= count
                ? "text-yellow-400 fill-yellow-400"
                : "text-muted-foreground",
              interactive && "cursor-pointer hover:scale-110"
            )}
            onClick={() => interactive && setRating(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">
          {t('ratings.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          Rate drivers and view their performance
        </p>
      </div>

      {/* Drivers List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : drivers?.length === 0 ? (
          <Card3D variant="panel" className="col-span-full text-center py-12">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">{t('common.noData')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete shipments to rate drivers
            </p>
          </Card3D>
        ) : (
          drivers?.map((driver: any) => (
            <Card3D key={driver.id} className="animate-slide-up">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{driver.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(Math.round(driver.rating || 5))}
                    <span className="text-sm text-muted-foreground">
                      ({driver.rating || 5.0})
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      {driver.truck_plate}
                    </span>
                    <span>{driver.total_trips || 0} trips</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border/50">
                <Button3D
                  variant="outline"
                  size="sm"
                  className="w-full"
                  icon={<Star className="w-4 h-4" />}
                  onClick={() => handleOpenRating(driver)}
                >
                  {t('ratings.addRating')}
                </Button3D>
              </div>
            </Card3D>
          ))
        )}
      </div>

      {/* Recent Ratings */}
      {ratings && ratings.length > 0 && (
        <Card3D variant="panel" className="animate-slide-up">
          <h2 className="font-display text-xl font-bold mb-6">Your Ratings History</h2>
          
          <div className="space-y-4">
            {ratings.map((ratingItem: any) => (
              <div
                key={ratingItem.id}
                className="flex items-start gap-4 p-4 rounded-xl bg-muted/30"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{ratingItem.drivers?.name || 'Driver'}</h4>
                    {renderStars(ratingItem.rating)}
                  </div>
                  {ratingItem.comment && (
                    <p className="text-sm text-muted-foreground mt-2 flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 mt-0.5" />
                      {ratingItem.comment}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card3D>
      )}

      {/* Rating Modal */}
      <Dialog open={showRatingModal} onOpenChange={setShowRatingModal}>
        <DialogContent className="modal-3d max-w-md p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="font-display text-2xl font-bold gradient-text">
              Rate {selectedDriver?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div className="flex justify-center mb-4">
                {renderStars(rating, true, 'lg')}
              </div>
              <p className="text-muted-foreground">
                {rating === 5 && "Excellent!"}
                {rating === 4 && "Very Good"}
                {rating === 3 && "Good"}
                {rating === 2 && "Fair"}
                {rating === 1 && "Poor"}
              </p>
            </div>
            
            <TextArea3D
              label="Comment (optional)"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            
            <div className="flex gap-3">
              <Button3D
                type="button"
                variant="outline"
                onClick={() => setShowRatingModal(false)}
                className="flex-1"
              >
                Cancel
              </Button3D>
              <Button3D
                onClick={handleSubmitRating}
                isLoading={submitting}
                icon={<Send className="w-5 h-5" />}
                className="flex-1"
              >
                Submit Rating
              </Button3D>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
