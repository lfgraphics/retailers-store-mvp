'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Search, Calendar, FilterX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { ORDER_STATUSES } from '@/lib/constants';

interface Order {
  _id: string;
  orderNumber: string;
  customerId: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  finalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

export default function RetailerOrders() {
  const router = useRouter();
  const { user, isLoading, accessToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'retailer')) {
      router.push('/retailer/login');
      return;
    }
    if (user && accessToken) {
      // Debounced search
      const timer = setTimeout(() => {
        fetchOrders();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router, accessToken, search, statusFilter, startDate, endDate, page]);

  const fetchOrders = async () => {
    setIsLoadingOrders(true);
    try {
      let url = `/api/retailer/orders?page=${page}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;

      const data = await apiClient.get(url);
      setOrders(data.orders || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await apiClient.put(`/api/retailer/orders/${orderId}`, { status: newStatus });

      toast.success('Order status updated');
      fetchOrders();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusConfig = (status: string) => {
    return ORDER_STATUSES.find(s => s.value === status) || ORDER_STATUSES[0];
  };

  if (isLoading || isLoadingOrders) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/retailer/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Orders</h1>
        </div>

        {/* Filters Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Order #, name, email..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={statusFilter}
                  onValueChange={(val) => {
                    setStatusFilter(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1"
                  />
                  <span>-</span>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('ALL');
                    setStartDate('');
                    setEndDate('');
                    setPage(1);
                  }}
                >
                  <FilterX className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {orders.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold">No orders yet</h3>
              <p className="mt-2 text-muted-foreground">
                Orders will appear here when customers place them
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order._id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">
                          Order #{order.orderNumber}
                        </h3>
                        <Badge variant={getStatusConfig(order.status).color as any}>
                          {getStatusConfig(order.status).label}
                        </Badge>
                        <Badge variant="outline">{order.paymentMethod}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-sm text-muted-foreground">Order Number</p>
                          <p className="font-medium">{order.orderNumber}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Customer</p>
                          <p className="font-medium">{order.customerId?.name || 'Guest'} • {order.customerId?.email || 'No email'}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm font-medium">Items:</p>
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.name} × {item.quantity}</span>
                              <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(order.finalAmount)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 ml-4">
                      <Select
                        value={order.status}
                        onValueChange={(value) => handleStatusUpdate(order._id, value)}
                        disabled={updatingOrderId === order._id}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Link href={`/retailer/orders/${order._id}`}>
                        <Button variant="outline" size="sm" className="w-full">View Details</Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center px-4 font-medium">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
