'use client';

import { useEffect, useState, Suspense, useCallback } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart, Search, ChevronLeft, ChevronRight, Package } from 'lucide-react';
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

  const fetchProducts = useCallback(async () => {
    try {
      const url = selectedCategory
        ? `/api/products?category=${encodeURIComponent(selectedCategory)}`
        : '/api/products';
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch {
      console.error('Failed to load categories');
    }
  }, []);

  const fetchRetailerProfile = useCallback(async () => {
    try {
      const data = await apiClient.get('/api/retailer/profile');
      setRetailer(data.profile);
    } catch {
      console.error('Failed to load retailer profile');
    }
  }, []);

  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchRetailerProfile();
  }, [fetchProducts, fetchCategories, fetchRetailerProfile]);

  useEffect(() => {
    if (retailer?.bannerImages?.length && retailer.bannerImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % retailer.bannerImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [retailer]);

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

  const groupedProducts = categories.map(cat => ({
    ...cat,
    products: products.filter(p => p.category === cat.name).slice(0, 8)
  })).filter(group => group.products.length > 0);

  const recentProducts = [...products]
    .sort((a, b) => new Date(b._id.toString()).getTime() - new Date(a._id.toString()).getTime())
    .slice(0, 10);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Hero / Banners Section - Enhanced Carousel */}
      {retailer?.bannerImages && retailer.bannerImages.length > 0 && (
        <section className="container mx-auto px-0 sm:px-4 pt-0 sm:pt-4">
          <div className="group relative aspect-2/1 sm:aspect-21/9 w-full overflow-hidden sm:rounded-2xl bg-muted shadow-sm sm:shadow-xl">
            {retailer.bannerImages.map((banner: string, idx: number) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${idx === currentBannerIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                  }`}
              >
                <Image
                  src={banner}
                  alt={`Promotion ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                  priority={idx === 0}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
              </div>
            ))}

            {/* Carousel Navigation Buttons */}
            {retailer.bannerImages.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + retailer.bannerImages.length) % retailer.bannerImages.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-foreground backdrop-blur-md transition-all hover:bg-background/40 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % retailer.bannerImages.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-foreground backdrop-blur-md transition-all hover:bg-background/40 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Enhanced Carousel Indicators */}
                <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2.5">
                  {retailer.bannerImages.map((_banner: string, idx: number) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentBannerIndex
                        ? 'bg-foreground w-8'
                        : 'bg-foreground/40 hover:bg-foreground/60 w-2.5'
                        }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Main Content Area */}
      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 space-y-8">
        {isLoading ? (
          <div className="space-y-8">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-9 w-24" />
                </div>
                <div className="grid gap-2 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <Card key={j} className="border-none bg-muted/30">
                      <CardContent className="p-0">
                        <Skeleton className="aspect-square w-full rounded-t-xl" />
                        <div className="p-3 sm:p-4 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : selectedCategory || search ? (
          /* Filtered/Search Results View */
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center justify-between mb-4 sm:mb-6 border-b pb-4">
              <h2 className="text-base sm:text-2xl font-bold text-foreground capitalize">
                {search ? `Results for "${search}"` : selectedCategory}
              </h2>
              {selectedCategory && (
                <Button variant="ghost" size="sm" onClick={() => setSelectedCategory(null)} className="text-primary font-bold">
                  Clear Filter
                </Button>
              )}
            </div>
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-24 bg-muted/20 rounded-3xl border-2 border-dashed">
                <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-xl font-medium">No products found</p>
                <Button variant="outline" className="mt-6" onClick={() => { setSelectedCategory(null); setSearch(''); }}>
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} handleAddToCart={handleAddToCart} />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Grouped Categories View (Home) */
          <>
            {groupedProducts.length > 0 ? (
              groupedProducts.map((group) => (
                <div key={group._id} className="bg-white p-4 rounded-lg border shadow-sm">
                  <div className="flex items-center justify-between mb-4 sm:mb-6 border-b pb-4">
                    <h2 className="text-base sm:text-xl font-bold text-foreground">
                      Best of {group.name}
                    </h2>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="font-bold text-xs sm:text-sm h-7 sm:h-9 px-4 rounded-sm shadow-sm bg-primary hover:bg-primary/90"
                      onClick={() => setSelectedCategory(group.name)}
                    >
                      VIEW ALL
                    </Button>
                  </div>
                  
                  <div className="grid gap-2 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.products.map((product) => (
                      <ProductCard key={product._id} product={product} handleAddToCart={handleAddToCart} />
                    ))}
                  </div>
                </div>
              ))
            ) : null}

            {/* Recent Products Section */}
            {recentProducts.length > 0 ? (
              <div className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-4 sm:mb-6 border-b pb-4">
                  <h2 className="text-base sm:text-xl font-bold text-foreground">
                    Newly Added Products
                  </h2>
                </div>
                
                <div className="grid gap-2 sm:gap-6 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {recentProducts.map((product) => (
                    <ProductCard key={product._id} product={product} handleAddToCart={handleAddToCart} />
                  ))}
                </div>
              </div>
            ) : groupedProducts.length === 0 && (
              <div className="text-center py-24 bg-white rounded-lg border shadow-sm">
                <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-xl font-medium">No products available yet</p>
                <p className="text-muted-foreground mt-2">Check back later for new arrivals!</p>
              </div>
            )}
          </>
        )}
      </main>

      <NotificationPrompt />
    </div>
  );
}

function ProductCard({ product, handleAddToCart }: { product: Product, handleAddToCart: (p: Product) => void }) {
  return (
    <Card className="group overflow-hidden border border-border/50 bg-card hover:shadow-lg transition-all duration-300 rounded-lg flex flex-col">
      <Link href={`/products/${product._id}`} className="relative aspect-3/4 sm:aspect-square bg-white overflow-hidden flex items-center justify-center p-2">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] sm:text-xs">
            No Image
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] flex items-center justify-center z-10">
            <Badge variant="destructive" className="px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase">
              Out of Stock
            </Badge>
          </div>
        )}
        {product.stock > 0 && product.stock < 10 && (
          <div className="absolute top-2 left-2 z-10">
            <Badge className="bg-orange-500 hover:bg-orange-600 border-none text-[9px] sm:text-[10px] px-1.5 py-0 shadow-sm">
              Only {product.stock} left
            </Badge>
          </div>
        )}
      </Link>
      <CardContent className="p-3 sm:p-4 flex flex-col flex-1 border-t border-border/50">
        <div className="flex-1">
          <Link href={`/products/${product._id}`}>
            <h3 className="font-medium text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors min-h-[2.5rem]">
              {product.name}
            </h3>
          </Link>
          
          <div className="flex items-center gap-1.5 mt-1">
            {product.avgRating > 0 && (
              <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-bold">
                <span>{product.avgRating}</span>
                <span className="text-[8px] sm:text-[10px]">★</span>
              </div>
            )}
            {product.reviewCount > 0 && (
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                ({product.reviewCount})
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <p className="text-sm sm:text-lg font-black text-foreground">
              {formatCurrency(product.price)}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground line-through decoration-muted-foreground/50">
              {formatCurrency(product.price * 1.25)}
            </p>
            <p className="text-[10px] sm:text-xs text-green-600 font-bold whitespace-nowrap">
              20% off
            </p>
          </div>
          
          <Button
            size="sm"
            className="w-full mt-3 rounded-lg h-8 sm:h-10 text-xs sm:text-sm font-bold shadow-sm active:scale-95 transition-all"
            onClick={() => handleAddToCart(product)}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading Store...</div>}>
      <ShopContent />
    </Suspense>
  );
}
