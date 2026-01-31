import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import {
  LayoutDashboard,
  FileText,
  Truck,
  Receipt,
  Star,
  User,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { t, language, setLanguage, dir } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.overview') },
    { path: '/requests', icon: FileText, label: t('nav.requests') },
    { path: '/tracking', icon: Truck, label: t('nav.tracking') },
    { path: '/invoices', icon: Receipt, label: t('nav.invoices') },
    { path: '/ratings', icon: Star, label: t('nav.ratings') },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 h-full z-50 transition-all duration-300 ease-in-out",
          "bg-sidebar border-r border-sidebar-border",
          "flex flex-col",
          dir() === 'rtl' ? 'right-0' : 'left-0',
          isOpen ? "w-64" : "w-0 lg:w-20",
          "lg:relative"
        )}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-sidebar-border">
          <div className={cn(
            "flex items-center gap-3 transition-opacity",
            !isOpen && "lg:opacity-0"
          )}>
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-glow">
              <Truck className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold gradient-text">عزة</span>
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "nav-item",
                  isActive && "active",
                  !isOpen && "lg:justify-center lg:px-0"
                )
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className={cn(
                "transition-opacity whitespace-nowrap",
                !isOpen && "lg:hidden"
              )}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <button
            onClick={toggleLanguage}
            className={cn(
              "nav-item w-full",
              !isOpen && "lg:justify-center lg:px-0"
            )}
          >
            <Globe className="w-5 h-5 flex-shrink-0" />
            <span className={cn(
              "transition-opacity whitespace-nowrap",
              !isOpen && "lg:hidden"
            )}>
              {language === 'en' ? 'العربية' : 'English'}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className={cn(
              "nav-item w-full text-destructive hover:bg-destructive/10",
              !isOpen && "lg:justify-center lg:px-0"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className={cn(
              "transition-opacity whitespace-nowrap",
              !isOpen && "lg:hidden"
            )}>
              {t('nav.logout')}
            </span>
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className={cn(
          "fixed top-4 z-30 p-3 rounded-xl bg-primary text-primary-foreground shadow-glow lg:hidden",
          dir() === 'rtl' ? 'right-4' : 'left-4'
        )}
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
};
