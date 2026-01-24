'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, History, Bell } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    url: '/',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'retailer')) {
      router.push('/retailer/login');
      return;
    }
    fetchHistory();
  }, [user, authLoading]);

  const fetchHistory = async () => {
    try {
      const data = await apiClient.get('/api/retailer/notifications/history');
      setNotifications(data.notifications || []);
      setIsLoadingHistory(false);
    } catch (error) {
      console.error('Failed to load notification history');
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.message) {
      toast.error('Title and message are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/api/retailer/notifications/broadcast', formData);
      toast.success('Broadcast sent successfully!');
      setFormData({ title: '', message: '', url: '/' });
      fetchHistory();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send broadcast');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user || user.role !== 'retailer') return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/retailer/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Push Notifications</h1>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Send Notification Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Notification Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., New Arrival!"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Message Content *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="e.g., Check out our latest collection in Electronics."
                      rows={4}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Action URL (Optional)</Label>
                    <Input
                      id="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="/shop"
                    />
                    <p className="text-xs text-muted-foreground">
                      Where the user will be taken when they click the notification.
                    </p>
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Broadcast to All Customers'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Bell className="h-10 w-10 text-primary shrink-0" />
                  <div>
                    <h4 className="font-bold">Pro Tip</h4>
                    <p className="text-sm text-muted-foreground">
                      Short, punchy messages have 3x higher click rates. Keep your title under 40 characters for best results across all devices.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recently Sent */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Broadcasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex justify-center py-8">
                  <p className="text-muted-foreground animate-pulse">Loading history...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No recently sent notifications.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif: any) => (
                    <div key={notif._id} className="border-b last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className="font-semibold">{notif.title}</h5>
                        <span className="text-xs text-muted-foreground">
                          {new Date(notif.sentAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
