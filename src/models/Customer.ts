import mongoose, { Schema, Document } from 'mongoose';
import { hashPassword } from '@/lib/auth';

interface IDeliveryAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface ICustomer extends Document {
  name: string;
  email?: string;
  password: string;
  phone: string;
  deliveryAddress: IDeliveryAddress;
  pushSubscriptions: any[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
  },
  { _id: false }
);

const CustomerSchema = new Schema<ICustomer>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true, // Allows multiple null values
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deliveryAddress: {
      type: DeliveryAddressSchema,
      required: true,
    },
    pushSubscriptions: {
      type: [Object],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for email lookup
CustomerSchema.index({ email: 1 }, { sparse: true });
// Index for phone lookup (already unique: true in schema, but good to be explicit)
CustomerSchema.index({ phone: 1 });

// Hash password before saving
CustomerSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await hashPassword(this.password);
});

export default mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
