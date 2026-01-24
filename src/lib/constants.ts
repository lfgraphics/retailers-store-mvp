// Order Status Configuration - SINGLE SOURCE OF TRUTH
export const ORDER_STATUSES = [
  { value: 'ORDERED', label: 'Ordered', color: 'default' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'secondary' },
  { value: 'PROCESSING', label: 'Processing', color: 'secondary' },
  { value: 'SHIPPED', label: 'Shipped', color: 'outline' },
  { value: 'DELIVERED', label: 'Delivered', color: 'default' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'destructive' },
] as const;

export const ORDER_STATUS = {
  ORDERED: 'ORDERED',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Payment Methods
export const PAYMENT_METHOD = {
  COD: 'COD',
  ONLINE: 'ONLINE',
} as const;

export type PaymentMethod = typeof PAYMENT_METHOD[keyof typeof PAYMENT_METHOD];

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// User Roles
export const USER_ROLE = {
  RETAILER: 'retailer',
  CUSTOMER: 'customer',
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

// Discount Types
export const DISCOUNT_TYPE = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const;

export type DiscountType = typeof DISCOUNT_TYPE[keyof typeof DISCOUNT_TYPE];

// Notification Target Audience
export const NOTIFICATION_AUDIENCE = {
  ALL: 'ALL',
  SPECIFIC: 'SPECIFIC',
} as const;

export type NotificationAudience = typeof NOTIFICATION_AUDIENCE[keyof typeof NOTIFICATION_AUDIENCE];

// Default Retailer Credentials
export const DEFAULT_RETAILER = {
  USERNAME: 'Admin',
  PASSWORD: '123',
} as const;

// API Routes
export const API_ROUTES = {
  // Auth
  AUTH_RETAILER_LOGIN: '/api/auth/retailer/login',
  AUTH_RETAILER_CHANGE_PASSWORD: '/api/auth/retailer/change-password',
  AUTH_CUSTOMER_REGISTER: '/api/auth/customer/register',
  AUTH_CUSTOMER_LOGIN: '/api/auth/customer/login',
  AUTH_REFRESH: '/api/auth/refresh',

  // Retailer
  RETAILER_PROFILE: '/api/retailer/profile',
  RETAILER_PRODUCTS: '/api/retailer/products',
  RETAILER_ORDERS: '/api/retailer/orders',
  RETAILER_REVIEWS: '/api/retailer/reviews',
  RETAILER_SETTINGS: '/api/retailer/settings',
  RETAILER_NOTIFICATIONS: '/api/retailer/notifications',

  // Customer
  PRODUCTS: '/api/products',
  CART_VALIDATE: '/api/cart/validate',
  COUPONS_VALIDATE: '/api/coupons/validate',
  ORDERS: '/api/orders',
  PAYMENT_CREATE: '/api/payment/create',
  PAYMENT_VERIFY: '/api/payment/verify',
  REVIEWS: '/api/reviews',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  INVALID_CREDENTIALS: 'Invalid credentials',
  TOKEN_EXPIRED: 'Token has expired',
  USER_NOT_FOUND: 'User not found',
  PRODUCT_NOT_FOUND: 'Product not found',
  ORDER_NOT_FOUND: 'Order not found',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  INVALID_COUPON: 'Invalid or expired coupon',
  REVIEW_NOT_ALLOWED: 'Reviews can only be submitted for delivered orders',
  SERVER_ERROR: 'Internal server error',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  REGISTRATION_SUCCESS: 'Registration successful',
  PRODUCT_CREATED: 'Product created successfully',
  PRODUCT_UPDATED: 'Product updated successfully',
  PRODUCT_DELETED: 'Product deleted successfully',
  ORDER_PLACED: 'Order placed successfully',
  ORDER_UPDATED: 'Order status updated',
  REVIEW_SUBMITTED: 'Review submitted successfully',
  NOTIFICATION_SENT: 'Notification sent successfully',
} as const;
