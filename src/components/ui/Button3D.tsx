import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface Button3DProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'accent' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button3D: React.FC<Button3DProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  disabled,
  ...props
}) => {
  const variants = {
    primary: "btn-float",
    accent: "btn-accent",
    ghost: "bg-transparent hover:bg-primary/10 text-foreground border border-transparent hover:border-primary/30 rounded-xl transition-all duration-300",
    outline: "bg-transparent border border-primary/50 text-primary hover:bg-primary/10 rounded-xl transition-all duration-300 hover:shadow-glow-soft",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold",
        variants[variant],
        sizes[size],
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
};

export const FloatingActionButton: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
}> = ({ icon, onClick, className }) => {
  return (
    <button
      onClick={onClick}
      className={cn("fab", className)}
    >
      {icon}
    </button>
  );
};
