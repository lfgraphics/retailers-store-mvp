'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X, ExternalLink } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import Link from 'next/link';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function NotificationHistory({ onClose }: { onClose: () => void }) {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dismissedIds, setDismissedIds] = useState<string[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('dismissedNotifications');
        if (saved) {
            setDismissedIds(JSON.parse(saved));
        }
        fetchNotifications();
    }, [user]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let endpoint = '/api/notifications/history';
            
            if (user?.role === 'customer') {
                endpoint = '/api/customer/notifications';
            } else if (user?.role === 'retailer') {
                endpoint = '/api/retailer/notifications/history';
            }

            // console.log('Fetching notifications from:', endpoint);
            
            // Send dismissed IDs to exclude them from fetch
            const queryParams = new URLSearchParams();
            if (dismissedIds.length > 0) {
                queryParams.append('exclude', dismissedIds.join(','));
            }
            
            const fullEndpoint = `${endpoint}?${queryParams.toString()}`;
            const data = await apiClient.get(fullEndpoint);
            
            if (data && data.notifications) {
                setNotifications(data.notifications);
            } else {
                setNotifications([]);
            }
        } catch (error) {
            console.error('Failed to fetch notification history');
            setError('Failed to load notifications');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearAll = () => {
        const currentIds = notifications.map(n => n._id);
        const newDismissed = Array.from(new Set([...dismissedIds, ...currentIds]));
        setDismissedIds(newDismissed);
        localStorage.setItem('dismissedNotifications', JSON.stringify(newDismissed));
        toast.success('All notifications cleared');
    };

    const visibleNotifications = notifications.filter(n => !dismissedIds.includes(n._id));

    return (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-50 animate-in fade-in zoom-in-95 duration-200">
            <Card className="shadow-xl border-primary/20 bg-background text-foreground">
                <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        Notifications
                    </CardTitle>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={fetchNotifications}
                            className="text-[10px] font-medium text-muted-foreground hover:text-primary"
                            title="Refresh"
                        >
                            Refresh
                        </button>
                        {visibleNotifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="text-[10px] font-medium text-primary hover:underline"
                            >
                                Clear All
                            </button>
                        )}
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 max-h-[400px] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
                    ) : error ? (
                        <div className="p-8 text-center text-sm text-destructive">
                            {error}
                            <div className="mt-2">
                                <button 
                                    onClick={fetchNotifications}
                                    className="text-xs underline hover:text-destructive/80"
                                >
                                    Try Again
                                </button>
                            </div>
                        </div>
                    ) : visibleNotifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground">
                            No new notifications.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {visibleNotifications.map((notif) => (
                                <div key={notif._id} className="p-4 hover:bg-accent/50 transition-colors">
                                    <div className="flex justify-between items-start gap-2">
                                        <h5 className="font-semibold text-sm leading-tight">{notif.title}</h5>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {format(new Date(notif.sentAt || Date.now()), 'MMM d, p')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {notif.message}
                                    </p>
                                    {notif.url && (
                                        <Link
                                            href={notif.url}
                                            className="text-[10px] text-primary font-medium hover:underline mt-2 flex items-center gap-1"
                                            onClick={onClose}
                                        >
                                            View Details <ExternalLink className="h-2 w-2" />
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
