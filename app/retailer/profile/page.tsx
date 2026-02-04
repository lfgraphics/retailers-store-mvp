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
import { ArrowLeft, Upload, X, ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    storeAddress: '',
    contactPhone: '',
    contactEmail: '',
    logo: '',
    bannerImages: [] as string[],
    banners: [] as { desktopUrl: string; mobileUrl: string }[],
    onlinePaymentEnabled: false,
    defaultDeliveryCharge: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role === 'retailer') {
      fetchProfile();
    } else if (!authLoading) {
      router.push('/retailer/login');
    }
  }, [user, authLoading, router]);

  const fetchProfile = async () => {
    try {
      const data = await apiClient.get('/api/retailer/profile', { cache: 'no-store' });
      setFormData({
        storeName: data.profile?.storeName || '',
        storeDescription: data.profile?.storeDescription || '',
        storeAddress: data.profile?.storeAddress || '',
        contactPhone: data.profile?.contactPhone || '',
        contactEmail: data.profile?.contactEmail || '',
        logo: data.profile?.logo || '',
        bannerImages: data.profile?.bannerImages || [],
        banners: data.profile?.banners || [],
        onlinePaymentEnabled: data.profile?.onlinePaymentEnabled || false,
        defaultDeliveryCharge: data.profile?.defaultDeliveryCharge || 0,
      });
    } catch (error: unknown) {
      console.error('Fetch profile error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'bannerImages') => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (field === 'logo') {
          setFormData(prev => ({ ...prev, logo: base64 }));
        } else {
          setFormData(prev => ({ ...prev, bannerImages: [...prev.bannerImages, base64] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number, type: 'desktop' | 'mobile') => {
    const files = e.target.files;
    if (!files || !files[0]) return;

    const file = files[0];
    
    // Validation
    const maxSize = type === 'desktop' ? 500 * 1024 : 200 * 1024; // 500KB for desktop, 200KB for mobile
    if (file.size > maxSize) {
      toast.error(`File size too large. Max allowed: ${type === 'desktop' ? '500KB' : '200KB'}`);
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type. Please upload an image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFormData(prev => {
        const newBanners = [...prev.banners];
        if (!newBanners[index]) {
          newBanners[index] = { desktopUrl: '', mobileUrl: '' };
        }
        if (type === 'desktop') {
          newBanners[index].desktopUrl = base64;
        } else {
          newBanners[index].mobileUrl = base64;
        }
        return { ...prev, banners: newBanners };
      });
      toast.success(`${type === 'desktop' ? 'Desktop' : 'Mobile'} banner uploaded`);
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsDataURL(file);
  };

  const addBannerSlot = () => {
    setFormData(prev => ({
      ...prev,
      banners: [...prev.banners, { desktopUrl: '', mobileUrl: '' }]
    }));
  };

  const removeBannerSlot = (index: number) => {
    setFormData(prev => ({
      ...prev,
      banners: prev.banners.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.put('/api/retailer/profile', formData);
      toast.success('Profile updated successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettingsUpdate = async (updates: Partial<typeof formData>) => {
    try {
      await apiClient.fetch('/api/retailer/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      setFormData(prev => ({ ...prev, ...updates }));
      toast.success('Settings updated successfully');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      toast.error(errorMessage);
    }
  };

  if (authLoading || isLoading || !user || user.role !== 'retailer') {
    return null;
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
          <h1 className="text-3xl font-bold">Store Profile</h1>
        </div>

        <div className="max-w-2xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Store Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo Section */}
                <div className="space-y-3">
                  <Label>Store Logo</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'logo')}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Click to upload logo</p>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                      {formData.logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-7 px-2"
                          onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Banners Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Responsive Banners</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addBannerSlot}>
                      Add Banner Slide
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    {formData.banners.map((banner, idx) => (
                      <div key={idx} className="p-4 border rounded-lg bg-card relative">
                        <button
                          type="button"
                          onClick={() => removeBannerSlot(idx)}
                          className="absolute top-2 right-2 p-1 text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        
                        <h4 className="text-sm font-medium mb-3">Slide {idx + 1}</h4>
                        
                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Desktop Banner */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Desktop (1920x600)</Label>
                            <label className="aspect-1920/600 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden relative group cursor-pointer hover:bg-muted/80 transition-colors">
                              {banner.desktopUrl ? (
                                <img src={banner.desktopUrl} alt="Desktop" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center text-muted-foreground pointer-events-none">
                                  <Upload className="h-6 w-6 mb-1" />
                                  <span className="text-[10px]">Upload Desktop</span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBannerUpload(e, idx, 'desktop')}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* Mobile Banner */}
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">Mobile (768x432)</Label>
                            <label className="aspect-768/432 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted overflow-hidden relative group cursor-pointer hover:bg-muted/80 transition-colors">
                              {banner.mobileUrl ? (
                                <img src={banner.mobileUrl} alt="Mobile" className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex flex-col items-center text-muted-foreground pointer-events-none">
                                  <Upload className="h-6 w-6 mb-1" />
                                  <span className="text-[10px]">Upload Mobile</span>
                                </div>
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleBannerUpload(e, idx, 'mobile')}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {formData.banners.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                        No banners added. Click &quot;Add Banner Slide&quot; to start.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input
                      id="storeName"
                      name="storeName"
                      value={formData.storeName}
                      onChange={handleChange}
                      placeholder="My Store"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeDescription">Store Description</Label>
                    <Textarea
                      id="storeDescription"
                      name="storeDescription"
                      value={formData.storeDescription}
                      onChange={handleChange}
                      placeholder="Describe your store..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="storeAddress">Store Address</Label>
                    <Textarea
                      id="storeAddress"
                      name="storeAddress"
                      value={formData.storeAddress}
                      onChange={handleChange}
                      placeholder="Full store address"
                      rows={2}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contactPhone">Contact Phone</Label>
                      <Input
                        id="contactPhone"
                        name="contactPhone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        placeholder="Phone number"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contactEmail">Contact Email</Label>
                      <Input
                        id="contactEmail"
                        name="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={handleChange}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Store Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Settings */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Online Payments (Razorpay)</p>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to pay online
                  </p>
                </div>
                <Button
                  variant={formData.onlinePaymentEnabled ? 'default' : 'outline'}
                  onClick={() => handleSettingsUpdate({ onlinePaymentEnabled: !formData.onlinePaymentEnabled })}
                >
                  {formData.onlinePaymentEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryCharge">Default Delivery Charge (₹)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="deliveryCharge"
                      type="number"
                      min="0"
                      value={formData.defaultDeliveryCharge}
                      onChange={(e) => setFormData(prev => ({ ...prev, defaultDeliveryCharge: Number(e.target.value) }))}
                      placeholder="0"
                    />
                    <Button 
                      onClick={() => handleSettingsUpdate({ defaultDeliveryCharge: formData.defaultDeliveryCharge })}
                    >
                      Save
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This amount will be added to all orders unless a free delivery coupon is applied.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
