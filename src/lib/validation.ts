import { z } from 'zod';

// Customer Registration Schema
export const customerRegistrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  deliveryAddress: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Pincode must be 6 digits'),
    landmark: z.string().optional(),
  }),
});

// Customer Login Schema
export const customerLoginSchema = z.object({
  phone: z.string().min(10, 'Phone number is required'),
  password: z.string().min(1, 'Password is required'),
});

// Retailer Login Schema
export const retailerLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

// Retailer Password Change Schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

// Product Schema
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().min(0, 'Price must be a positive number'),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
  category: z.string().min(2, 'Category is required'),
  images: z.array(z.string()).optional(),
});

// Order Item Schema
export const orderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

// Order Creation Schema
export const orderCreationSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  deliveryAddress: z.object({
    street: z.string().min(5, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().min(6, 'Pincode must be 6 digits'),
    landmark: z.string().optional(),
  }),
  paymentMethod: z.enum(['COD', 'ONLINE']),
  couponCode: z.string().optional(),
});

// Review Schema
export const reviewSchema = z.object({
  productId: z.string(),
  orderId: z.string(),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().min(10, 'Comment must be at least 10 characters'),
});

// Coupon Schema
export const couponSchema = z.object({
  code: z.string().min(3, 'Coupon code must be at least 3 characters'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().min(0, 'Discount value must be positive'),
  minOrderAmount: z.number().min(0, 'Minimum order amount must be non-negative'),
  maxDiscountAmount: z.number().min(0).optional(),
  validFrom: z.string().or(z.date()),
  validTo: z.string().or(z.date()),
  usageLimit: z.number().int().min(0).optional(),
});

// Notification Schema
export const notificationSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  image: z.string().optional(),
  targetAudience: z.enum(['ALL', 'SPECIFIC']),
  targetCustomerIds: z.array(z.string()).optional(),
});

// Store Profile Update Schema
export const storeProfileSchema = z.object({
  storeName: z.string().min(2, 'Store name must be at least 2 characters'),
  storeDescription: z.string().optional(),
  storeAddress: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('Invalid email address').optional(),
  logo: z.string().optional(),
  bannerImages: z.array(z.string()).optional(),
});
