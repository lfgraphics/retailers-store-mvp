'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Search, User, LogOut, Bell } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { NotificationPrompt } from '@/components/NotificationPrompt';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
  category: string;
  avgRating: number;
  reviewCount: number;
}

interface Category {
  _id: string;
  name: string;
}

interface RetailerProfile {
  storeName: string;
  storeDescription: string;
  logo?: string;
  bannerImages: string[];
}

function ShopContent() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [retailer, setRetailer] = useState<RetailerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const searchParams = useSearchParams();
  const urlSearch = searchParams.get('search') || '';

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchRetailerProfile();
  }, [selectedCategory]);

  useEffect(() => {
    if (retailer?.bannerImages?.length && retailer.bannerImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % retailer.bannerImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [retailer]);

  const fetchProducts = async () => {
    try {
      const url = selectedCategory
        ? `/api/products?category=${encodeURIComponent(selectedCategory)}`
        : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories');
    }
  };

  const fetchRetailerProfile = async () => {
    try {
      const data = await apiClient.get('/api/retailer/profile');
      setRetailer(data.profile);
    } catch (error) {
      console.error('Failed to load retailer profile');
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      router.push('/login');
      return;
    }

    addItem({
      productId: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      stock: product.stock,
    });

    toast.success('Added to cart');
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Search & Categories (Secondary Header) */}
      <div className="border-b bg-background/95 backdrop-blur sticky top-16 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="rounded-full whitespace-nowrap"
            >
              All
            </Button>
            {categories.map((cat) => (
              <Button
                key={cat._id}
                variant={selectedCategory === cat.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat.name)}
                className="rounded-full whitespace-nowrap"
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero / Banners Section */}
      {retailer?.bannerImages && retailer.bannerImages.length > 0 && (
        <section className="container mx-auto px-4 pt-6">
          <div className="relative aspect-21/9 w-full overflow-hidden rounded-xl bg-muted">
            {retailer.bannerImages.map((banner: string, idx: number) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentBannerIndex ? 'opacity-100' : 'opacity-0'
                  }`}
              >
                <img
                  src={banner}
                  alt={`Promotion ${idx + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
            {retailer.bannerImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {retailer.bannerImages.map((_: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBannerIndex(idx)}
                    className={`h-2 w-2 rounded-full transition-all ${idx === currentBannerIndex ? 'bg-white w-4' : 'bg-white/50'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Products Grid */}
      <main className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="aspect-square w-full rounded-lg" />
                  <Skeleton className="mt-4 h-4 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <Card key={product._id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <Link href={`/products/${product._id}`}>
                  <div className="aspect-square bg-muted relative">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No Image
                      </div>
                    )}
                    {product.stock === 0 && (
                      <Badge className="absolute top-2 right-2" variant="destructive">
                        Out of Stock
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link href={`/products/${product._id}`}>
                    <h3 className="font-semibold line-clamp-1 hover:underline">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {product.description}
                    </p>
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-lg font-bold">{formatCurrency(product.price)}</p>
                    {product.avgRating > 0 && (
                      <span className="text-sm text-muted-foreground">
                        ⭐ {product.avgRating} ({product.reviewCount})
                      </span>
                    )}
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <NotificationPrompt />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Store...</div>}>
      <ShopContent />
    </Suspense>
  );
}
