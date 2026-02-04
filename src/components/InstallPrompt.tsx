'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Check if app is already installed or if user dismissed
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      if (!isStandalone) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsVisible(false);
      setDeferredPrompt(null);
      toast.success('App installed successfully!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 animate-in slide-in-from-bottom-4 duration-300 md:hidden print:hidden">
      <Card className="bg-primary text-primary-foreground shadow-xl border-none max-w-[300px]">
        <button 
          onClick={() => setIsVisible(false)} 
          className="absolute top-2 right-2 text-primary-foreground/80 hover:text-primary-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-xl">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm">Install App</h4>
            <p className="text-xs opacity-90 mb-2">Get the best experience</p>
            <Button 
              size="sm" 
              variant="secondary" 
              className="h-7 text-xs font-bold w-full"
              onClick={handleInstall}
            >
              Install Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
