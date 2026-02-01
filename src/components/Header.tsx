'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, Search, Bell, LogOut, User, SlidersHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { useFilter } from '@/contexts/FilterContext';
import { NotificationHistory } from '@/components/NotificationHistory';
import { ThemeToggle } from '@/components/ThemeToggle';

interface RetailerProfile {
  storeName: string;
  logo?: string;
}

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { setIsOpen: setFilterOpen } = useFilter();
  const router = useRouter();
  const [retailer, setRetailer] = useState<RetailerProfile | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const data = await apiClient.get('/api/retailer/profile');
        if (isMounted) {
          setRetailer(data.profile);
        }
      } catch {
        console.error('Failed to load retailer profile');
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-8">
          <Link href="/shop" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
            <div className="relative h-8 w-8 sm:h-10 sm:w-10">
              {retailer?.logo ? (
                <Image 
                  src={retailer.logo} 
                  alt="Logo" 
                  fill
                  className="rounded-lg sm:rounded-xl object-cover shadow-sm transition-transform group-hover:scale-110 border-2 border-white/20" 
                  unoptimized
                />
              ) : (
                <div className="h-full w-full rounded-lg sm:rounded-xl bg-white/10 flex items-center justify-center border-2 border-white/20">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              )}
            </div>
            <div className="hidden xs:block">
              <h1 className="text-base sm:text-xl font-black tracking-tight leading-tight group-hover:opacity-90 transition-opacity">
                {retailer?.storeName || 'Store'}
              </h1>
            </div>
          </Link>

          {/* Desktop Search Bar with Filter */}
          <div className="hidden md:flex flex-1 max-w-2xl items-center gap-2">
            <form onSubmit={handleSearch} className="flex-1 relative group">
              <Input
                placeholder="Search for products, brands and more"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-4 pr-10 py-5 w-full bg-white border-none rounded-sm text-black placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm text-sm"
              />
              <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0 h-full text-primary hover:bg-transparent">
                <Search className="h-5 w-5" />
              </Button>
            </form>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" title="Filters" onClick={() => setFilterOpen(true)}>
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 text-white hover:bg-white/10"
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {!user && (
              <Link href="/login" className="hidden sm:block">
                <Button variant="secondary" className="bg-white text-primary hover:bg-white/90 font-bold px-8 py-0 h-8 rounded-sm text-sm shadow-sm">
                  Login
                </Button>
              </Link>
            )}

            <ThemeToggle />
            
            {user ? (
              <>
                <div className="relative group">
                  <Button variant="ghost" className="text-white hover:bg-white/10 font-bold gap-1 hidden sm:flex">
                    <User className="h-4 w-4" />
                    {user.name ? user.name.split(' ')[0] : 'User'}
                  </Button>
                  <div className="hidden group-hover:block absolute top-full right-0 pt-2">
                    <Card className="w-48 shadow-xl border-none rounded-sm overflow-hidden">
                      <div className="p-1">
                        <Link href={user.role === 'retailer' ? '/retailer/dashboard' : '/orders'}>
                          <Button variant="ghost" className="w-full justify-start text-sm h-10 rounded-none hover:bg-accent">
                            {user.role === 'retailer' ? 'Dashboard' : 'My Orders'}
                          </Button>
                        </Link>
                        <Button variant="ghost" className="w-full justify-start text-sm h-10 rounded-none text-destructive hover:text-destructive hover:bg-destructive/5" onClick={logout}>
                          <LogOut className="h-4 w-4 mr-2" />
                          Logout
                        </Button>
                      </div>
                    </Card>
                  </div>
                </div>

                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-white hover:bg-white/10"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="h-5 w-5" />
                  </Button>
                  {showNotifications && (
                    <NotificationHistory onClose={() => setShowNotifications(false)} />
                  )}
                </div>

                <Link href="/cart">
                  <Button variant="ghost" className="text-white hover:bg-white/10 font-bold gap-2 relative">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="hidden sm:inline">Cart</span>
                    {totalItems > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-4 min-w-[16px] rounded-full px-1 text-[9px] font-bold flex items-center justify-center bg-yellow-400 text-primary border-none">
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <Button variant="ghost" size="icon" className="sm:hidden h-9 w-9 text-white hover:bg-white/10" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <>
                <Link href="/cart">
                  <Button variant="ghost" className="text-white hover:bg-white/10 font-bold gap-2 relative">
                    <ShoppingCart className="h-5 w-5" />
                    <span className="hidden sm:inline">Cart</span>
                  </Button>
                </Link>
                <Link href="/login" className="sm:hidden">
                  <Button variant="ghost" className="text-white hover:bg-white/10 font-bold text-sm">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile Search Bar - Expandable */}
        {isMobileSearchOpen && (
          <div className="md:hidden pb-3 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Input
                  autoFocus
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-4 pr-10 py-4 w-full bg-white border-none rounded-sm text-black placeholder:text-muted-foreground text-sm shadow-inner"
                />
                <Button type="submit" variant="ghost" size="icon" className="absolute right-0 top-0 h-full text-primary">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setFilterOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
