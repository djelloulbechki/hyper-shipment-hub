import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useInvoices } from '@/hooks/useClientData';
import { Card3D, StatCard } from '@/components/ui/Card3D';
import { Button3D } from '@/components/ui/Button3D';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import {
  Receipt,
  DollarSign,
  CheckCircle,
  Clock,
  Download,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Invoices() {
  const { t } = useI18n();
  const { data: invoices, isLoading } = useInvoices();

  // Calculate monthly spend
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  
  const monthlyInvoices = invoices?.filter((inv: any) => 
    isWithinInterval(new Date(inv.created_at), { start: monthStart, end: monthEnd })
  ) || [];
  
  const monthlySpend = monthlyInvoices.reduce((sum: number, inv: any) => 
    sum + Number(inv.amount), 0
  );

  const totalSpend = invoices?.reduce((sum: number, inv: any) => 
    sum + Number(inv.amount), 0
  ) || 0;

  const paidInvoices = invoices?.filter((inv: any) => inv.status === 'paid').length || 0;
  const pendingInvoices = invoices?.filter((inv: any) => inv.status === 'pending').length || 0;

  const getStatusBadge = (status: string) => {
    const isCompleted = status === 'paid';
    return (
      <span className={cn(
        "badge-status",
        isCompleted ? "badge-completed" : "badge-pending"
      )}>
        {isCompleted ? <CheckCircle className="w-4 h-4 mr-1" /> : <Clock className="w-4 h-4 mr-1" />}
        {status === 'paid' ? t('status.paid') : t('status.pending')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold gradient-text">
          {t('invoices.title')}
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your payments and billing history
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('invoices.totalSpend')}
          value={totalSpend.toLocaleString()}
          icon={<DollarSign className="w-6 h-6" />}
          suffix={t('common.sar')}
          className="animate-slide-up"
        />
        <StatCard
          title={t('invoices.thisMonth')}
          value={monthlySpend.toLocaleString()}
          icon={<Receipt className="w-6 h-6" />}
          suffix={t('common.sar')}
          className="animate-slide-up"
          style={{ animationDelay: '0.1s' }}
        />
        <StatCard
          title="Paid Invoices"
          value={paidInvoices}
          icon={<CheckCircle className="w-6 h-6" />}
          className="animate-slide-up"
          style={{ animationDelay: '0.2s' }}
        />
        <StatCard
          title="Pending"
          value={pendingInvoices}
          icon={<Clock className="w-6 h-6" />}
          className="animate-slide-up"
          style={{ animationDelay: '0.3s' }}
        />
      </div>

      {/* Invoices Table */}
      <Card3D variant="panel" className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">All Invoices</h2>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : invoices?.length === 0 ? (
          <div className="text-center py-12">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">{t('common.noData')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-grid w-full">
              <thead>
                <tr>
                  <th>{t('invoices.id')}</th>
                  <th>Order</th>
                  <th>{t('invoices.amount')}</th>
                  <th>{t('invoices.status')}</th>
                  <th>Created</th>
                  <th>{t('invoices.paidAt')}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices?.map((invoice: any) => (
                  <tr key={invoice.id} className="group">
                    <td className="font-mono text-sm text-primary">
                      INV-{invoice.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="font-mono text-sm">
                      #{invoice.orders?.id?.slice(0, 8)}
                    </td>
                    <td>
                      <span className="font-display font-bold text-lg">
                        {Number(invoice.amount).toLocaleString()}
                      </span>
                      <span className="text-muted-foreground ml-1 text-sm">
                        {t('common.sar')}
                      </span>
                    </td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td className="text-muted-foreground">
                      {format(new Date(invoice.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="text-muted-foreground">
                      {invoice.paid_at
                        ? format(new Date(invoice.paid_at), 'MMM d, yyyy')
                        : '-'}
                    </td>
                    <td>
                      <Button3D
                        variant="ghost"
                        size="sm"
                        icon={<Download className="w-4 h-4" />}
                        onClick={() => {
                          // In a real app, this would download the invoice
                          console.log('Download invoice', invoice.id);
                        }}
                      >
                        Download
                      </Button3D>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card3D>
    </div>
  );
}
