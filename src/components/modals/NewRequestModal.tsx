import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input3D, TextArea3D, Select3D } from '@/components/ui/Input3D';
import { Button3D } from '@/components/ui/Button3D';
import { useI18n } from '@/lib/i18n';
import { supabase } from '@/integrations/supabase/client';
import { useClientProfile } from '@/hooks/useClientData';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { MapPin, Truck, Hash, Calendar, FileText, Send } from 'lucide-react';
import { z } from 'zod';

const requestSchema = z.object({
  from_location: z.string().min(1, 'From location is required'),
  to_location: z.string().min(1, 'To location is required'),
  truck_type: z.enum(['flatbed', 'refrigerated', 'tanker', 'container', 'lowboy', 'dry_van']),
  required_trucks_count: z.number().min(1).max(100),
  min_manufacturing_year: z.number().optional(),
  notes: z.string().optional(),
});

interface NewRequestModalProps {
  open: boolean;
  onClose: () => void;
}

export const NewRequestModal: React.FC<NewRequestModalProps> = ({ open, onClose }) => {
  const { t } = useI18n();
  const { data: client } = useClientProfile();
  const queryClient = useQueryClient();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    from_location: '',
    to_location: '',
    truck_type: 'flatbed',
    required_trucks_count: 1,
    min_manufacturing_year: new Date().getFullYear() - 5,
    notes: '',
  });

  const truckTypeOptions = [
    { value: 'flatbed', label: t('truck.flatbed') },
    { value: 'refrigerated', label: t('truck.refrigerated') },
    { value: 'tanker', label: t('truck.tanker') },
    { value: 'container', label: t('truck.container') },
    { value: 'lowboy', label: t('truck.lowboy') },
    { value: 'dry_van', label: t('truck.dry_van') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = requestSchema.parse({
        ...formData,
        required_trucks_count: Number(formData.required_trucks_count),
        min_manufacturing_year: formData.min_manufacturing_year ? Number(formData.min_manufacturing_year) : undefined,
      });
      
      setErrors({});
      setLoading(true);

      if (!client?.id) {
        toast.error('Client profile not found');
        return;
      }

      const { error } = await supabase.from('orders').insert({
        client_id: client.id,
        from_location: validated.from_location,
        to_location: validated.to_location,
        truck_type: validated.truck_type,
        required_trucks_count: validated.required_trucks_count,
        min_manufacturing_year: validated.min_manufacturing_year,
        notes: validated.notes,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Request created successfully!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      onClose();
      
      // Reset form
      setFormData({
        from_location: '',
        to_location: '',
        truck_type: 'flatbed',
        required_trucks_count: 1,
        min_manufacturing_year: new Date().getFullYear() - 5,
        notes: '',
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        err.errors.forEach((e) => {
          if (e.path[0]) {
            fieldErrors[e.path[0].toString()] = e.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast.error('Failed to create request');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="modal-3d max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="font-display text-2xl font-bold gradient-text">
            {t('requests.createNew')}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input3D
            label={t('form.fromLocation')}
            icon={<MapPin className="w-5 h-5" />}
            value={formData.from_location}
            onChange={(e) => setFormData({ ...formData, from_location: e.target.value })}
            placeholder="e.g., Riyadh"
            error={errors.from_location}
          />
          
          <Input3D
            label={t('form.toLocation')}
            icon={<MapPin className="w-5 h-5" />}
            value={formData.to_location}
            onChange={(e) => setFormData({ ...formData, to_location: e.target.value })}
            placeholder="e.g., Jeddah"
            error={errors.to_location}
          />
          
          <Select3D
            label={t('form.truckType')}
            value={formData.truck_type}
            onChange={(e) => setFormData({ ...formData, truck_type: e.target.value })}
            options={truckTypeOptions}
            error={errors.truck_type}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input3D
              label={t('form.trucksRequired')}
              icon={<Hash className="w-5 h-5" />}
              type="number"
              min={1}
              max={100}
              value={formData.required_trucks_count}
              onChange={(e) => setFormData({ ...formData, required_trucks_count: parseInt(e.target.value) || 1 })}
              error={errors.required_trucks_count}
            />
            
            <Input3D
              label={t('form.minYear')}
              icon={<Calendar className="w-5 h-5" />}
              type="number"
              min={2000}
              max={new Date().getFullYear()}
              value={formData.min_manufacturing_year}
              onChange={(e) => setFormData({ ...formData, min_manufacturing_year: parseInt(e.target.value) })}
              error={errors.min_manufacturing_year}
            />
          </div>
          
          <TextArea3D
            label={t('form.notes')}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any special requirements..."
            error={errors.notes}
          />
          
          <div className="flex gap-3 pt-4">
            <Button3D
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              {t('form.cancel')}
            </Button3D>
            <Button3D
              type="submit"
              className="flex-1"
              isLoading={loading}
              icon={<Send className="w-5 h-5" />}
            >
              {t('form.submit')}
            </Button3D>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
