import mongoose, { Schema, Document } from 'mongoose';
import { hashPassword } from '@/lib/auth';

export interface IRetailer extends Document {
  username: string;
  password: string;
  isFirstLogin: boolean;
  storeName: string;
  storeDescription: string;
  storeAddress: string;
  contactPhone: string;
  contactEmail: string;
  logo?: string;
  bannerImages: string[];
  onlinePaymentEnabled: boolean;
  pushSubscriptions: any[];
  createdAt: Date;
  updatedAt: Date;
}

const RetailerSchema = new Schema<IRetailer>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      default: 'Admin',
    },
    password: {
      type: String,
      required: true,
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
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
    bannerImages: {
      type: [String],
      default: [],
    },
    onlinePaymentEnabled: {
      type: Boolean,
      default: false,
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

// Hash password before saving
RetailerSchema.pre('save', async function (this: any) {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await hashPassword(this.password);
});

export default (mongoose.models.Retailer || mongoose.model<IRetailer>('Retailer', RetailerSchema)) as any;
