'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';
import { getNotificationPermission, subscribeToPushNotifications } from '@/lib/push-notifications';
import { toast } from 'sonner';

export function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  useEffect(() => {
    // Show prompt only if permission is default and not dismissed this session
    const checkPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const dismissed = sessionStorage.getItem('notificationPromptDismissed');
        if (!dismissed) {
          // Delay showing the prompt slightly
          setTimeout(() => setIsVisible(true), 3000);
        }
      }
    };
    checkPermission();
  }, []);

  const handleSubscribe = async () => {
    setIsSubscribing(true);
    try {
      const permission = await getNotificationPermission();
      if (permission === 'granted') {
        const success = await subscribeToPushNotifications();
        if (success) {
          toast.success('You are now subscribed to notifications!');
          setIsVisible(false);
        } else {
          toast.error('Failed to subscribe to notifications.');
        }
      } else if (permission === 'denied') {
        toast.warning('Notification permission denied. You can change this in your browser settings.');
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('An error occurred during subscription.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('notificationPromptDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
      <Card className="border-primary shadow-lg overflow-hidden">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="bg-primary/10 p-2 rounded-full h-fit">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Stay Updated!</h4>
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                Get instant notifications about order updates and new product arrivals.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubscribe} disabled={isSubscribing}>
                  {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDismiss}>
                  Later
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
