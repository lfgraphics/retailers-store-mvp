'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { ArrowLeft, Package } from 'lucide-react';

interface Order {
  _id: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  finalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && accessToken) {
      fetchOrders();
    }
  }, [user, isLoading, accessToken]);

  const fetchOrders = async () => {
    try {
      const data = await apiClient.get('/api/orders');
      setOrders(data.orders || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      ORDERED: 'default',
      CONFIRMED: 'secondary',
      PROCESSING: 'secondary',
      SHIPPED: 'secondary',
      DELIVERED: 'default',
      CANCELLED: 'destructive',
    };
    return colors[status] || 'default';
  };

  if (isLoading || isLoadingOrders) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-8 w-32 bg-muted animate-pulse rounded" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 w-full bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/shop">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">My Orders</h1>
        </div>

        {orders.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't placed any orders yet. Start shopping to see your orders here!
              </p>
              <Link href="/shop">
                <Button>Go to Shop</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <Link key={order._id} href={`/orders/${order._id}`}>
                <Card className="transition-colors hover:bg-accent/50 cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-muted-foreground">
                            #{order._id.slice(-8).toUpperCase()}
                          </span>
                          <Badge variant={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="font-medium">
                          {order.items.length} {order.items.length === 1 ? 'item' : 'items'} • {formatCurrency(order.finalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Placed on {new Date(order.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex -space-x-2 overflow-hidden">
                        {/* Placeholder for item preview (could add thumbnails later) */}
                        <div className="h-10 w-10 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                          +{order.items.length}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="md:w-fit w-full">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
