import mongoose, { Schema, Document } from 'mongoose';

export interface IRetailer extends Document {
  storeName: string;
  storeDescription: string;
  storeAddress: string;
  contactPhone: string;
  contactEmail: string;
  logo?: string;
  bannerImages: string[];
  banners: { desktopUrl: string; mobileUrl: string }[];
  onlinePaymentEnabled: boolean;
  defaultDeliveryCharge: number;
  pushSubscriptions: any[];
  createdAt: Date;
  updatedAt: Date;
}

const RetailerSchema = new Schema<IRetailer>(
  {
    storeName: {
      type: String,
      default: 'My Store',
    },
    storeDescription: {
      type: String,
      default: 'Welcome to our store',
    },
    storeAddress: {
      type: String,
      default: '',
    },
    contactPhone: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: '',
    },
    logo: {
      type: String,
    },
    banners: {
      type: [
        {
          desktopUrl: { type: String, required: true },
          mobileUrl: { type: String, required: true },
          _id: false,
        }
      ],
      default: [],
    },
    // Deprecated but kept for backward compatibility if needed, though we will migrate UI to use 'banners'
    bannerImages: {
      type: [String],
      default: [],
    },
    onlinePaymentEnabled: {
      type: Boolean,
      default: false,
    },
    defaultDeliveryCharge: {
      type: Number,
      default: 0,
    },
    pushSubscriptions: {
      type: [Schema.Types.Mixed],
      default: [],
    } as any,
  },
  {
    timestamps: true,
  }
);

// Prevent Mongoose model compilation errors in development due to hot reloading
if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Retailer;
}

export default (mongoose.models.Retailer || mongoose.model<IRetailer>('Retailer', RetailerSchema)) as any;
