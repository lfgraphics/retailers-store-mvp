import { MetadataRoute } from 'next';
import connectDB from '@/lib/mongodb';
import Retailer from '@/models/Retailer';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let storeName = 'Local Store';
  let storeDescription = 'Your local store online - Shop quality products with home delivery';
  let logoUrl = '/icon.svg';
  let banners: { desktopUrl: string; mobileUrl: string }[] = [];
  
  try {
    await connectDB();
    const retailer = await Retailer.findOne().select('storeName storeDescription logo banners');
    if (retailer) {
      storeName = retailer.storeName || storeName;
      storeDescription = retailer.storeDescription || storeDescription;
      if (retailer.logo) logoUrl = retailer.logo;
      if (retailer.banners && retailer.banners.length > 0) banners = retailer.banners;
    }
  } catch (error) {
    console.error('Failed to fetch store details for manifest:', error);
  }

  const iconType = logoUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  
  const screenshots: any[] = [];
  
  if (banners.length > 0) {
    // Add Desktop Screenshot
    if (banners[0].desktopUrl) {
      screenshots.push({
        src: banners[0].desktopUrl,
        sizes: '1280x720',
        type: 'image/jpeg', // Assuming jpeg/png for banners
        form_factor: 'wide',
        label: 'Desktop Home Screen',
      });
    }
    // Add Mobile Screenshot
    if (banners[0].mobileUrl) {
      screenshots.push({
        src: banners[0].mobileUrl,
        sizes: '720x1280',
        type: 'image/jpeg',
        label: 'Mobile Home Screen',
      });
    }
  } else {
    // Fallback to logo if no banners
    screenshots.push(
      {
        src: logoUrl,
        sizes: '1280x720',
        type: iconType,
        form_factor: 'wide',
        label: 'Desktop Home Screen',
      },
      {
        src: logoUrl,
        sizes: '720x1280',
        type: iconType,
        label: 'Mobile Home Screen',
      }
    );
  }

  return {
    name: storeName,
    short_name: storeName.length > 12 ? storeName.slice(0, 12) : storeName,
    description: storeDescription,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0a0a0a',
    orientation: 'portrait-primary',
    icons: [
      {
        src: logoUrl,
        sizes: '192x192',
        type: iconType,
        purpose: 'any',
      },
      {
        src: logoUrl,
        sizes: '512x512',
        type: iconType,
        purpose: 'maskable',
      },
    ],
    screenshots: screenshots,
    categories: ['shopping', 'business'],
    shortcuts: [
      {
        name: 'Shop Products',
        short_name: 'Shop',
        description: 'Browse our product catalog',
        url: '/',
        icons: [{ src: logoUrl, sizes: '192x192', type: iconType }],
      },
      {
        name: 'My Orders',
        short_name: 'Orders',
        description: 'View your order history',
        url: '/orders',
        icons: [{ src: logoUrl, sizes: '192x192', type: iconType }],
      },
    ],
  };
}
