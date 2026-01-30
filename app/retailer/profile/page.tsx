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
  const { user, accessToken, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    storeName: '',
    storeDescription: '',
    storeAddress: '',
    contactPhone: '',
    contactEmail: '',
    logo: '',
    bannerImages: [] as string[],
    onlinePaymentEnabled: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user && user.role === 'retailer') {
      fetchProfile();
    } else if (!authLoading) {
      router.push('/retailer/login');
    }
  }, [user, authLoading]);

  const fetchProfile = async () => {
    try {
      const data = await apiClient.get('/api/retailer/profile');
      setFormData({
        storeName: data.profile?.storeName || '',
        storeDescription: data.profile?.storeDescription || '',
        storeAddress: data.profile?.storeAddress || '',
        contactPhone: data.profile?.contactPhone || '',
        contactEmail: data.profile?.contactEmail || '',
        logo: data.profile?.logo || '',
        bannerImages: data.profile?.bannerImages || [],
        onlinePaymentEnabled: data.profile?.onlinePaymentEnabled || false,
      });
    } catch (error: any) {
      console.error('Fetch profile error:', error);
      toast.error(error.message || 'Failed to load profile');
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

  const removeBanner = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bannerImages: prev.bannerImages.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.put('/api/retailer/profile', formData);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentToggle = async () => {
    try {
      await apiClient.fetch('/api/retailer/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ onlinePaymentEnabled: !formData.onlinePaymentEnabled }),
      });
      setFormData({ ...formData, onlinePaymentEnabled: !formData.onlinePaymentEnabled });
      toast.success('Payment settings updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update payment settings');
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
                  <Label>Banner Images</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {formData.bannerImages.map((banner, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden group">
                        <img src={banner} alt={`Banner ${idx + 1}`} className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeBanner(idx)}
                          className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <label className="aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center bg-muted cursor-pointer hover:bg-accent transition-colors">
                      <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                      <span className="text-xs font-medium">Add Banner</span>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageUpload(e, 'bannerImages')}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground">These banners will be displayed in your store's carousel.</p>
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
              <CardTitle>Payment Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Online Payments (Razorpay)</p>
                  <p className="text-sm text-muted-foreground">
                    Allow customers to pay online
                  </p>
                </div>
                <Button
                  variant={formData.onlinePaymentEnabled ? 'default' : 'outline'}
                  onClick={handlePaymentToggle}
                >
                  {formData.onlinePaymentEnabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
