import React from 'react';
import { cn } from '@/lib/utils';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'stat' | 'panel';
  glow?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className,
  variant = 'default',
  glow = false,
  onClick,
  style,
}) => {
  const baseStyles = "relative overflow-hidden transition-all duration-400";
  
  const variants = {
    default: "card-3d p-6",
    stat: "stat-card",
    panel: "panel-holo",
  };

  return (
    <div
      className={cn(
        baseStyles,
        variants[variant],
        glow && "animate-glow-pulse",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; isUp: boolean };
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  suffix,
  className,
  style,
}) => {
  return (
    <Card3D variant="stat" className={cn("min-h-[140px]", className)} style={style}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-xl bg-primary/20 text-primary">
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-semibold px-2 py-1 rounded-full",
            trend.isUp ? "bg-accent/20 text-accent" : "bg-destructive/20 text-destructive"
          )}>
            {trend.isUp ? '↑' : '↓'} {trend.value}%
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <div className="flex items-baseline gap-2">
        <span className="stat-value">{value}</span>
        {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
      </div>
    </Card3D>
  );
};
