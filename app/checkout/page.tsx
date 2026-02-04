'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const loadRazorpayScript = () => {
    return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
};

export default function CheckoutPage() {
    const router = useRouter();
    const { user, accessToken, isLoading } = useAuth();
    const { items, totalPrice, clearCart } = useCart();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
    const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(false);
    const [useNewAddress, setUseNewAddress] = useState(false);
    const [saveForFuture, setSaveForFuture] = useState(false);
    const [savedAddress, setSavedAddress] = useState({
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
    });
    const [newAddress, setNewAddress] = useState({
        street: '',
        city: '',
        state: '',
        pincode: '',
        landmark: '',
    });
    
    // Coupon & Delivery State
    const [couponInput, setCouponInput] = useState('');
    const [appliedCoupons, setAppliedCoupons] = useState<any[]>([]);
    const [baseDeliveryCharge, setBaseDeliveryCharge] = useState(0);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (!isLoading && items.length === 0) {
            router.push('/cart');
            return;
        }

        if (user) {
            fetchUserProfile();
            fetchStoreSettings();
        }
    }, [user, items, isLoading]);

    const fetchUserProfile = async () => {
        try {
            const res = await fetch('/api/customer/profile', {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!res.ok) {
                console.error('Profile fetch failed:', res.status);
                return;
            }

            const data = await res.json();

            if (data.customer?.deliveryAddress) {
                setSavedAddress(data.customer.deliveryAddress);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    const fetchStoreSettings = async () => {
        try {
            const res = await fetch('/api/retailer/settings');
            const data = await res.json();
            setOnlinePaymentEnabled(data.onlinePaymentEnabled || false);
            setBaseDeliveryCharge(data.defaultDeliveryCharge || 0);
        } catch (error) {
            console.error('Failed to load store settings:', error);
        }
    };

    // Coupon Handlers
    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        const code = couponInput.trim().toUpperCase();

        if (appliedCoupons.some(c => c.code === code)) {
            toast.error('Coupon already applied');
            return;
        }

        if (appliedCoupons.length >= 2) {
            toast.error('Maximum 2 coupons allowed');
            return;
        }

        setIsApplyingCoupon(true);
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });
            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || 'Invalid coupon');
                return;
            }

            const newCoupon = data.coupon;
            
            // Validate combinations
            const hasFreeDelivery = appliedCoupons.some(c => c.discountType === 'FREE_DELIVERY');
            const hasDiscount = appliedCoupons.some(c => c.discountType !== 'FREE_DELIVERY');

            if (newCoupon.discountType === 'FREE_DELIVERY' && hasFreeDelivery) {
                toast.error('Only one free delivery coupon allowed');
                return;
            }

            if (newCoupon.discountType !== 'FREE_DELIVERY' && hasDiscount) {
                toast.error('Only one discount coupon allowed');
                return;
            }

            setAppliedCoupons([...appliedCoupons, newCoupon]);
            setCouponInput('');
            toast.success('Coupon applied!');
        } catch (error) {
            toast.error('Failed to apply coupon');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const removeCoupon = (code: string) => {
        setAppliedCoupons(appliedCoupons.filter(c => c.code !== code));
    };

    // Calculations
    const deliveryCharge = appliedCoupons.some(c => c.discountType === 'FREE_DELIVERY') 
        ? 0 
        : baseDeliveryCharge;

    const calculateDiscount = () => {
        let discount = 0;
        const discountCoupon = appliedCoupons.find(c => c.discountType !== 'FREE_DELIVERY');
        
        if (discountCoupon) {
            if (discountCoupon.discountType === 'PERCENTAGE') {
                discount = (totalPrice * discountCoupon.discountValue) / 100;
                if (discountCoupon.maxDiscountAmount) {
                    discount = Math.min(discount, discountCoupon.maxDiscountAmount);
                }
            } else {
                discount = discountCoupon.discountValue;
            }
        }
        return Math.min(discount, totalPrice);
    };

    const totalDiscount = calculateDiscount();
    const finalTotal = totalPrice + deliveryCharge - totalDiscount;

    const handleNewAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewAddress({ ...newAddress, [e.target.name]: e.target.value });
    };

    const handlePlaceOrder = async () => {
        const addressToUse = useNewAddress ? newAddress : savedAddress;

        // Validate address
        if (!addressToUse.street || !addressToUse.city || !addressToUse.state || !addressToUse.pincode) {
            toast.error('Please fill in all required address fields');
            return;
        }

        setIsSubmitting(true);

        try {
            // Save address for future if requested
            if (useNewAddress && saveForFuture) {
                await fetch('/api/customer/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ deliveryAddress: newAddress }),
                });
            }

            const orderData = {
                items: items.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                })),
                deliveryAddress: addressToUse,
                paymentMethod,
                couponCodes: appliedCoupons.map(c => c.code),
            };

            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify(orderData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to place order');
            }

            // Handle Online Payment
            if (paymentMethod === 'ONLINE' && data.order.razorpayOrderId) {
                const resLoaded = await loadRazorpayScript();

                if (!resLoaded) {
                    toast.error('Razorpay SDK failed to load. Are you online?');
                    setIsSubmitting(false);
                    return;
                }

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: data.order.finalAmount * 100,
                    currency: 'INR',
                    name: 'Local Store',
                    description: 'Order Payment',
                    order_id: data.order.razorpayOrderId,
                    handler: async function (response: any) {
                        try {
                            const verifyRes = await fetch('/api/payments/verify', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${accessToken}`,
                                },
                                body: JSON.stringify({
                                    orderId: data.order._id,
                                    razorpayPaymentId: response.razorpay_payment_id,
                                    razorpayOrderId: response.razorpay_order_id,
                                    razorpaySignature: response.razorpay_signature,
                                }),
                            });

                            const verifyData = await verifyRes.json();
                            if (verifyRes.ok) {
                                toast.success('Payment successful!');
                                clearCart();
                                router.push(`/orders/${data.order._id}`);
                            } else {
                                throw new Error(verifyData.error || 'Payment verification failed');
                            }
                        } catch (error: any) {
                            toast.error(error.message || 'Payment verification failed');
                            router.push(`/orders/${data.order._id}`);
                        }
                    },
                    prefill: {
                        name: user?.name || '',
                        email: user?.email || '',
                        contact: (user as any)?.phone || '',
                    },
                    theme: {
                        color: '#3b82f6',
                    },
                };

                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
                setIsSubmitting(false);
                return;
            }

            toast.success('Order placed successfully!');
            clearCart();
            router.push(`/orders/${data.order._id}`);
        } catch (error: any) {
            toast.error(error.message || 'Failed to place order');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !user || items.length === 0) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <h1 className="mb-6 text-3xl font-bold">Checkout</h1>

                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        {/* Coupons Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Coupons & Offers</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter coupon code"
                                        value={couponInput}
                                        onChange={(e) => setCouponInput(e.target.value)}
                                        disabled={isApplyingCoupon}
                                    />
                                    <Button 
                                        onClick={handleApplyCoupon} 
                                        disabled={isApplyingCoupon || !couponInput.trim()}
                                    >
                                        {isApplyingCoupon ? 'Applying...' : 'Apply'}
                                    </Button>
                                </div>

                                {appliedCoupons.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {appliedCoupons.map((coupon) => (
                                            <div 
                                                key={coupon.code} 
                                                className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium"
                                            >
                                                <span>{coupon.code}</span>
                                                <button 
                                                    onClick={() => removeCoupon(coupon.code)}
                                                    className="hover:text-destructive transition-colors"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Delivery Address */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Delivery Address</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Saved Address */}
                                {savedAddress.street && !useNewAddress && (
                                    <div className="p-4 border rounded-lg bg-accent/10">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">Saved Address</p>
                                                <p className="text-sm mt-1">{savedAddress.street}</p>
                                                {savedAddress.landmark && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Near: {savedAddress.landmark}
                                                    </p>
                                                )}
                                                <p className="text-sm">
                                                    {savedAddress.city}, {savedAddress.state} - {savedAddress.pincode}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="mt-3"
                                            onClick={() => setUseNewAddress(true)}
                                        >
                                            Use Different Address
                                        </Button>
                                    </div>
                                )}

                                {/* New Address Form */}
                                {(useNewAddress || !savedAddress.street) && (
                                    <div className="space-y-4">
                                        {savedAddress.street && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setUseNewAddress(false)}
                                            >
                                                Use Saved Address
                                            </Button>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="street">Street Address *</Label>
                                            <Input
                                                id="street"
                                                name="street"
                                                value={newAddress.street}
                                                onChange={handleNewAddressChange}
                                                placeholder="House/Flat No., Street Name"
                                                required
                                            />
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City *</Label>
                                                <Input
                                                    id="city"
                                                    name="city"
                                                    value={newAddress.city}
                                                    onChange={handleNewAddressChange}
                                                    placeholder="City"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="state">State *</Label>
                                                <Input
                                                    id="state"
                                                    name="state"
                                                    value={newAddress.state}
                                                    onChange={handleNewAddressChange}
                                                    placeholder="State"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="pincode">Pincode *</Label>
                                                <Input
                                                    id="pincode"
                                                    name="pincode"
                                                    value={newAddress.pincode}
                                                    onChange={handleNewAddressChange}
                                                    placeholder="6-digit pincode"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="landmark">Landmark (Optional)</Label>
                                                <Input
                                                    id="landmark"
                                                    name="landmark"
                                                    value={newAddress.landmark}
                                                    onChange={handleNewAddressChange}
                                                    placeholder="Nearby landmark"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 pt-2">
                                            <Checkbox
                                                id="saveForFuture"
                                                checked={saveForFuture}
                                                onCheckedChange={(checked) => setSaveForFuture(!!checked)}
                                            />
                                            <Label
                                                htmlFor="saveForFuture"
                                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                            >
                                                Save this address for future use
                                            </Label>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Method</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'COD' | 'ONLINE')}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="COD" id="cod" />
                                        <Label htmlFor="cod" className="cursor-pointer">
                                            Cash on Delivery (COD)
                                        </Label>
                                    </div>
                                    {onlinePaymentEnabled && (
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="ONLINE" id="online" />
                                            <Label htmlFor="online" className="cursor-pointer">
                                                Online Payment (Razorpay)
                                            </Label>
                                        </div>
                                    )}
                                </RadioGroup>
                                {!onlinePaymentEnabled && (
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Online payment is currently unavailable
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Order Summary */}
                    <div>
                        <Card className="sticky top-20">
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <div key={item.productId} className="flex justify-between text-sm">
                                            <div className="flex-1">
                                                <p className="font-medium line-clamp-1">{item.name}</p>
                                                <p className="text-muted-foreground">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="font-medium">
                                                {formatCurrency(item.price * item.quantity)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t pt-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Delivery Charge</span>
                                        <span className={deliveryCharge === 0 ? 'text-green-600 font-medium' : ''}>
                                            {deliveryCharge === 0 ? 'FREE' : formatCurrency(deliveryCharge)}
                                        </span>
                                    </div>
                                    {totalDiscount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600 font-medium">
                                            <span>Discount</span>
                                            <span>-{formatCurrency(totalDiscount)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="border-t pt-4">
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total</span>
                                        <span>{formatCurrency(finalTotal)}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handlePlaceOrder}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Placing Order...' : 'Place Order'}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
