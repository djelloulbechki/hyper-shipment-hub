import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input3D } from '@/components/ui/Input3D';
import { Button3D } from '@/components/ui/Button3D';
import { Card3D } from '@/components/ui/Card3D';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { Truck, Mail, Lock, Building2, Phone, ArrowRight, Sparkles } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { t, language, setLanguage, dir } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    try {
      emailSchema.parse(email);
    } catch {
      newErrors.email = 'Please enter a valid email';
    }
    
    try {
      passwordSchema.parse(password);
    } catch {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!isLogin && !companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        toast.success('Welcome back!');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('This email is already registered. Please login instead.');
          } else {
            toast.error(error.message);
          }
          return;
        }
        
        if (data.user) {
          // Create client profile
          const { error: profileError } = await supabase.from('clients').insert({
            user_id: data.user.id,
            company_name: companyName,
            company_name_ar: companyName,
            phone: phone,
            email: email,
          });
          
          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
          
          toast.success('Account created! Please check your email to verify.');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" dir={dir()}>
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-primary/5 rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and title */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary shadow-glow mb-6">
            <Truck className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold gradient-text mb-2">
            عزة
          </h1>
          <p className="text-muted-foreground">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Auth card */}
        <Card3D variant="panel" className="animate-scale-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-bold">
              {isLogin ? t('auth.login') : t('auth.signup')}
            </h2>
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="text-sm text-primary hover:text-primary-glow transition-colors"
            >
              {language === 'en' ? 'العربية' : 'English'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <Input3D
                  label={t('auth.companyName')}
                  icon={<Building2 className="w-5 h-5" />}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  error={errors.companyName}
                />
                <Input3D
                  label={t('auth.phone')}
                  icon={<Phone className="w-5 h-5" />}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 5XX XXX XXXX"
                />
              </>
            )}
            
            <Input3D
              label={t('auth.email')}
              icon={<Mail className="w-5 h-5" />}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@company.com"
              error={errors.email}
            />
            
            <Input3D
              label={t('auth.password')}
              icon={<Lock className="w-5 h-5" />}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              error={errors.password}
            />

            <Button3D
              type="submit"
              className="w-full mt-6"
              isLoading={loading}
              icon={<ArrowRight className="w-5 h-5" />}
            >
              {isLogin ? t('auth.login') : t('auth.signup')}
            </Button3D>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="text-primary font-semibold">
                {isLogin ? t('auth.signup') : t('auth.login')}
              </span>
            </button>
          </div>
        </Card3D>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {[
            { icon: Truck, label: 'Fast Delivery' },
            { icon: Sparkles, label: 'Real-time' },
            { icon: Lock, label: 'Secure' },
          ].map((feature, i) => (
            <div
              key={i}
              className="text-center p-3 rounded-xl bg-card/30 border border-border/50"
            >
              <feature.icon className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{feature.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
