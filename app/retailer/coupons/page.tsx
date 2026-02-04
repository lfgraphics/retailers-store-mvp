'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Trash2, Plus, Tag, Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED' | 'FREE_DELIVERY';
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
  isFreeDelivery: boolean;
  isActive: boolean;
  usageLimit?: number;
  usedCount: number;
}

export default function CouponsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED' | 'FREE_DELIVERY',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    validFrom: format(new Date(), 'yyyy-MM-dd'),
    validTo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    usageLimit: '',
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/retailer/login');
      return;
    }
    if (user?.role === 'retailer') {
      fetchCoupons();
    }
  }, [user, isLoading, router]);

  const fetchCoupons = async () => {
    try {
      const data = await apiClient.get('/api/retailer/coupons');
      setCoupons(data.coupons);
    } catch (error) {
      console.error('Failed to fetch coupons');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!formData.code) {
      toast.error('Coupon code is required');
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare payload
      const payload: any = {
        code: formData.code,
        discountType: formData.discountType,
        minOrderAmount: Number(formData.minOrderAmount) || 0,
        validFrom: new Date(formData.validFrom).toISOString(),
        validTo: new Date(formData.validTo).toISOString(),
      };

      if (formData.discountType === 'FREE_DELIVERY') {
        payload.discountValue = 0;
        payload.isFreeDelivery = true;
      } else {
        payload.discountValue = Number(formData.discountValue);
        if (formData.maxDiscountAmount) {
          payload.maxDiscountAmount = Number(formData.maxDiscountAmount);
        }
      }

      if (formData.usageLimit) {
        payload.usageLimit = Number(formData.usageLimit);
      }

      await apiClient.post('/api/retailer/coupons', payload);
      toast.success('Coupon created successfully');
      setIsDialogOpen(false);
      resetForm();
      fetchCoupons();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await apiClient.delete(`/api/retailer/coupons/${id}`);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch (error: any) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.fetchJSON(`/api/retailer/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      setCoupons(coupons.map(c => c._id === id ? { ...c, isActive: !currentStatus } : c));
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      validFrom: format(new Date(), 'yyyy-MM-dd'),
      validTo: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      usageLimit: '',
    });
  };

  if (isLoading || loadingCoupons) return <div className="p-8">Loading...</div>;

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Coupon Management</h1>
          <p className="text-muted-foreground">Create and manage discounts for your store</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Coupon Code</Label>
                  <Input 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    placeholder="SUMMER2025"
                    className="uppercase"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select 
                    value={formData.discountType} 
                    onValueChange={(val: any) => setFormData({...formData, discountType: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount (₹)</SelectItem>
                      <SelectItem value="FREE_DELIVERY">Free Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.discountType !== 'FREE_DELIVERY' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Discount Value {formData.discountType === 'PERCENTAGE' ? '(%)' : '(₹)'}</Label>
                    <Input 
                      type="number"
                      value={formData.discountValue} 
                      onChange={(e) => setFormData({...formData, discountValue: e.target.value})}
                      placeholder={formData.discountType === 'PERCENTAGE' ? '10' : '100'}
                    />
                  </div>
                  {formData.discountType === 'PERCENTAGE' && (
                    <div className="space-y-2">
                      <Label>Max Discount (Optional)</Label>
                      <Input 
                        type="number"
                        value={formData.maxDiscountAmount} 
                        onChange={(e) => setFormData({...formData, maxDiscountAmount: e.target.value})}
                        placeholder="500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Order Amount (₹)</Label>
                  <Input 
                    type="number"
                    value={formData.minOrderAmount} 
                    onChange={(e) => setFormData({...formData, minOrderAmount: e.target.value})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Usage Limit (Optional)</Label>
                  <Input 
                    type="number"
                    value={formData.usageLimit} 
                    onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    placeholder="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valid From</Label>
                  <Input 
                    type="date"
                    value={formData.validFrom} 
                    onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid To</Label>
                  <Input 
                    type="date"
                    value={formData.validTo} 
                    onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={handleCreateCoupon} disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Coupon'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {coupons.map((coupon) => (
          <Card key={coupon._id} className={!coupon.isActive ? 'opacity-60' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                {coupon.code}
              </CardTitle>
              <Switch 
                checked={coupon.isActive} 
                onCheckedChange={() => handleToggleStatus(coupon._id, coupon.isActive)}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {coupon.discountType === 'FREE_DELIVERY' 
                  ? 'Free Delivery' 
                  : coupon.discountType === 'PERCENTAGE' 
                    ? `${coupon.discountValue}% OFF` 
                    : `₹${coupon.discountValue} OFF`
                }
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Min Order:</span>
                  <span className="font-medium text-foreground">₹{coupon.minOrderAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Usage:</span>
                  <span>{coupon.usedCount} / {coupon.usageLimit || '∞'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t mt-2">
                  <span className="flex items-center gap-1 text-xs">
                    <CalendarIcon className="h-3 w-3" />
                    {new Date(coupon.validTo).toLocaleDateString()}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteCoupon(coupon._id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {coupons.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No coupons found. Create your first coupon to get started.
        </div>
      )}
    </div>
  );
}
