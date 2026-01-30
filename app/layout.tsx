import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { Toaster } from '@/components/ui/sonner';
import { Header } from '@/components/Header';
import { ThemeProvider } from '@/components/ThemeProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Local Store - Shop Online',
  description: 'Your local store, now online. Shop quality products with home delivery.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Local Store',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <CartProvider>
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
              <footer className="bg-[#212121] text-white py-12">
                <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <h4 className="text-muted-foreground text-xs font-bold uppercase mb-4">About</h4>
                    <ul className="space-y-2 text-xs font-bold">
                      <li className="hover:underline cursor-pointer">Contact Us</li>
                      <li className="hover:underline cursor-pointer">About Us</li>
                      <li className="hover:underline cursor-pointer">Careers</li>
                      <li className="hover:underline cursor-pointer">FlipStore Stories</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-muted-foreground text-xs font-bold uppercase mb-4">Help</h4>
                    <ul className="space-y-2 text-xs font-bold">
                      <li className="hover:underline cursor-pointer">Payments</li>
                      <li className="hover:underline cursor-pointer">Shipping</li>
                      <li className="hover:underline cursor-pointer">Cancellation</li>
                      <li className="hover:underline cursor-pointer">FAQ</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-muted-foreground text-xs font-bold uppercase mb-4">Policy</h4>
                    <ul className="space-y-2 text-xs font-bold">
                      <li className="hover:underline cursor-pointer">Return Policy</li>
                      <li className="hover:underline cursor-pointer">Terms Of Use</li>
                      <li className="hover:underline cursor-pointer">Security</li>
                      <li className="hover:underline cursor-pointer">Privacy</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-muted-foreground text-xs font-bold uppercase mb-4">Social</h4>
                    <ul className="space-y-2 text-xs font-bold">
                      <li className="hover:underline cursor-pointer">Facebook</li>
                      <li className="hover:underline cursor-pointer">Twitter</li>
                      <li className="hover:underline cursor-pointer">YouTube</li>
                    </ul>
                  </div>
                </div>
                <div className="container mx-auto px-4 mt-12 pt-8 border-t border-gray-700 flex flex-wrap justify-between gap-4 text-xs font-medium">
                  <div className="flex gap-6">
                    <span className="flex items-center gap-2">Become a Seller</span>
                    <span className="flex items-center gap-2">Advertise</span>
                    <span className="flex items-center gap-2">Gift Cards</span>
                    <span className="flex items-center gap-2">Help Center</span>
                  </div>
                  <span>© 2026 FlipStore.com</span>
                </div>
              </footer>
              <Toaster />
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
