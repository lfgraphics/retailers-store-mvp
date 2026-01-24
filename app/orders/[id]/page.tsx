'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import Link from 'next/link';
import { Phone, Mail, MapPin, Store, Star } from 'lucide-react';

interface Order {
  _id: string;
  items: Array<{ productId: string; name: string; quantity: number; price: number }>;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    landmark?: string;
  };
  finalAmount: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
}

interface RetailerProfile {
  storeName: string;
  storeDescription: string;
  storeAddress: string;
  contactPhone: string;
  contactEmail: string;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const router = useRouter();
  const { user, accessToken, isLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [retailerProfile, setRetailerProfile] = useState<RetailerProfile | null>(null);
  const [isLoadingOrder, setIsLoadingOrder] = useState(true);
  const [reviewItem, setReviewItem] = useState<{ productId: string; name: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && accessToken) {
      fetchOrder();
      fetchRetailerProfile();
    }
  }, [user, isLoading, accessToken]);

  const fetchOrder = async () => {
    try {
      const data = await apiClient.get(`/api/orders/${id}`);
      setOrder(data.order);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load order');
    } finally {
      setIsLoadingOrder(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewItem || !order) return;

    setIsSubmittingReview(true);
    try {
      await apiClient.post('/api/reviews', {
        productId: reviewItem.productId,
        orderId: order._id,
        rating: reviewRating,
        comment: reviewComment,
      });
      toast.success('Review submitted successfully!');
      setReviewItem(null);
      setReviewComment('');
      setReviewRating(5);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const fetchRetailerProfile = async () => {
    try {
      const data = await apiClient.get('/api/retailer/profile');
      setRetailerProfile(data.profile);
    } catch (error: any) {
      console.error('Failed to load retailer profile:', error);
    }
  };

  if (isLoading || isLoadingOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold">Order not found</h2>
        <Link href="/orders">
          <Button className="mt-4">View All Orders</Button>
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'secondary' | 'destructive'> = {
      ORDERED: 'default',
      CONFIRMED: 'secondary',
      PROCESSING: 'secondary',
      SHIPPED: 'secondary',
      DELIVERED: 'default',
      CANCELLED: 'destructive',
    };
    return colors[status] || 'default';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold">Order Details</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between pb-3 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <p className="font-semibold">
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      {order.status === 'DELIVERED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReviewItem({ productId: item.productId, name: item.name })}
                        >
                          Rate Product
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Delivery Address */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{order.deliveryAddress.street}</p>
                {order.deliveryAddress.landmark && (
                  <p className="text-sm text-muted-foreground">
                    Near: {order.deliveryAddress.landmark}
                  </p>
                )}
                <p>
                  {order.deliveryAddress.city}, {order.deliveryAddress.state}
                </p>
                <p>PIN: {order.deliveryAddress.pincode}</p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">#{order._id.slice(-8)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusColor(order.status)} className="mt-1">
                    {order.status}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium">{order.paymentMethod}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.finalAmount)}</span>
                  </div>
                </div>

                <Link href="/orders">
                  <Button variant="outline" className="w-full">
                    View All Orders
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Retailer Contact Info */}
            {retailerProfile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Contact Seller
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Store Name</p>
                    <p className="font-medium">{retailerProfile.storeName}</p>
                  </div>

                  {retailerProfile.contactPhone && (
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <a
                          href={`tel:${retailerProfile.contactPhone}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {retailerProfile.contactPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {retailerProfile.contactEmail && (
                    <div className="flex items-start gap-2">
                      <Mail className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a
                          href={`mailto:${retailerProfile.contactEmail}`}
                          className="font-medium text-primary hover:underline break-all"
                        >
                          {retailerProfile.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {retailerProfile.storeAddress && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-1 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium text-sm">{retailerProfile.storeAddress}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Rate {reviewItem.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'
                        }`}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Review</label>
                <textarea
                  className="w-full min-h-[100px] p-3 rounded-md border bg-background"
                  placeholder="Share your experience with this product..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setReviewItem(null)}
                  disabled={isSubmittingReview}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview || !reviewComment.trim()}
                >
                  {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
