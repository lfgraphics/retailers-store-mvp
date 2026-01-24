'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, ShoppingCart, Users, Settings, LogOut, Bell } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { NotificationPrompt } from '@/components/NotificationPrompt';

export default function RetailerDashboard() {
  const router = useRouter();
  const { user, logout, isLoading, accessToken } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    revenue: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'retailer')) {
      router.push('/retailer/login');
    } else if (user && user.role === 'retailer' && accessToken) {
      fetchStats();
    }
  }, [user, isLoading, router, accessToken]);

  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const data = await apiClient.get('/api/retailer/stats');
      setStats(data.stats);
    } catch (error: any) {
      console.error('Error in fetchStats:', error);
      toast.error(error.message || 'Failed to load dashboard statistics');
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (isLoading || !user || user.role !== 'retailer') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">


      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-3xl font-bold">Welcome back!</h2>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/retailer/products">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.products}
                </div>
                <p className="text-xs text-muted-foreground">Manage your inventory →</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/retailer/orders">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingStats ? '...' : stats.pendingOrders}
                </div>
                <p className="text-xs text-muted-foreground">Orders to process →</p>
              </CardContent>
            </Card>
          </Link>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '...' : stats.totalCustomers}
              </div>
              <p className="text-xs text-muted-foreground">Registered customers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoadingStats ? '...' : `₹${stats.revenue.toLocaleString()}`}
              </div>
              <p className="text-xs text-muted-foreground">Delivered orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link href="/retailer/products">
              <Card className="transition-colors hover:bg-accent cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Manage Products
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Add, edit, or remove products from your inventory
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/retailer/orders">
              <Card className="transition-colors hover:bg-accent cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    View Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Process and manage customer orders
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/retailer/categories">
              <Card className="transition-colors hover:bg-accent cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Manage Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Organize products into categories
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/retailer/notifications">
              <Card className="transition-colors hover:bg-accent cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Push Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Send broadcast messages to customers
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/retailer/profile">
              <Card className="transition-colors hover:bg-accent cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Store Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Update store profile and settings
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </main>
      <NotificationPrompt />
    </div>
  );
}
