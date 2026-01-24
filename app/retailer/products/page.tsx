'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    category: string;
    images: string[];
    isActive: boolean;
}

export default function ProductsPage() {
    const router = useRouter();
    const { user, accessToken, isLoading: authLoading } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && (!user || user.role !== 'retailer')) {
            router.push('/retailer/login');
            return;
        }
        if (user && accessToken) {
            fetchProducts();
        }
    }, [user, authLoading, router, accessToken]);

    const fetchProducts = async () => {
        try {
            const data = await apiClient.get('/api/retailer/products');
            setProducts(data.products || []);
        } catch (error: any) {
            toast.error(error.message || 'Failed to load products');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await apiClient.delete(`/api/retailer/products/${id}`);
            toast.success('Product deleted');
            fetchProducts();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete product');
        }
    };

    if (authLoading || !user || user.role !== 'retailer') return null;

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/retailer/dashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <h1 className="text-3xl font-bold">Products</h1>
                    </div>
                    <Link href="/retailer/products/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-4">
                                    <Skeleton className="aspect-square w-full" />
                                    <Skeleton className="mt-4 h-4 w-3/4" />
                                    <Skeleton className="mt-2 h-4 w-1/2" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <Card className="p-12">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold">No products yet</h3>
                            <p className="mt-2 text-muted-foreground">
                                Start by adding your first product
                            </p>
                            <Link href="/retailer/products/new">
                                <Button className="mt-4">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Product
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <Card key={product._id}>
                                <CardContent className="p-4">
                                    <div className="aspect-square w-full rounded-lg bg-muted mb-4">
                                        {product.images[0] && (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="h-full w-full object-cover rounded-lg"
                                            />
                                        )}
                                    </div>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                                            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                                                {product.description}
                                            </p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <Badge variant={product.isActive ? 'default' : 'secondary'}>
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <Badge variant="outline">Stock: {product.stock}</Badge>
                                            </div>
                                            <p className="mt-2 text-lg font-bold">
                                                {formatCurrency(product.price)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        <Link href={`/retailer/products/${product._id}`} className="flex-1">
                                            <Button variant="outline" className="w-full" size="sm">
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(product._id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
