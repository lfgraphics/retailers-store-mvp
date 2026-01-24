'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Search, User, LogOut, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient } from '@/lib/api-client';
import { NotificationHistory } from '@/components/NotificationHistory';

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [retailer, setRetailer] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRetailerProfile();
  }, []);

  const fetchRetailerProfile = async () => {
    try {
      const data = await apiClient.get('/api/retailer/profile');
      setRetailer(data.profile);
    } catch (error) {
      console.error('Failed to load retailer profile');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Don't show header on login/register pages if needed, 
  // but usually it's fine. Retailer dashboard has its own sidebar usually.
  const isRetailerPath = pathname.startsWith('/retailer');

  // If it's a retailer path (except maybe landing), we might want a different header 
  // or no header if they have a sidebar. But user said "whole app".
  // Let's keep it simple for now.

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link href="/shop" className="flex items-center gap-3 shrink-0">
            {retailer?.logo && (
              <img src={retailer.logo} alt="Logo" className="h-8 w-8 rounded-md object-cover" />
            )}
            <h1 className="text-xl font-bold hidden sm:block">
              {retailer?.storeName || 'Local Store'}
            </h1>
          </Link>

          {/* Search Bar - Global */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-full bg-muted/50 border-none focus-visible:ring-1"
            />
          </form>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <Link href="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                      <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                        {totalItems}
                      </Badge>
                    )}
                  </Button>
                </Link>

                <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNotifications(!showNotifications)}
                  >
                    <Bell className="h-5 w-5" />
                  </Button>
                  {showNotifications && (
                    <NotificationHistory onClose={() => setShowNotifications(false)} />
                  )}
                </div>

                <Link href={user.role === 'retailer' ? '/retailer/dashboard' : '/orders'} className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    {user.role === 'retailer' ? 'Dashboard' : 'Orders'}
                  </Button>
                </Link>

                {user.role === 'retailer' && (
                  <Link href="/shop" className="hidden sm:block">
                    <Button variant="ghost" size="sm">
                      Store Home
                    </Button>
                  </Link>
                )}

                <Button variant="ghost" size="icon" onClick={logout}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
