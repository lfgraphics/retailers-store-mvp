import mongoose, { Schema, Document } from 'mongoose';
import { hashPassword } from '@/lib/auth';

export interface IAdmin extends Document {
  username: string;
  password: string;
  name: string;
  role: 'super_admin' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      default: 'Admin User',
    },
    role: {
      type: String,
      enum: ['super_admin', 'admin'],
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
AdminSchema.pre('save', async function (this: any) {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await hashPassword(this.password);
});

// Prevent Mongoose model compilation errors in development due to hot reloading
if (process.env.NODE_ENV !== 'production') {
  delete mongoose.models.Admin;
}

export default (mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema)) as any;
