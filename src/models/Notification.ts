import mongoose, { Schema, Document, Types } from 'mongoose';
import { NotificationAudience } from '@/lib/constants';

export interface INotification extends Document {
  title: string;
  message: string;
  image?: string;
  targetAudience: NotificationAudience;
  targetCustomerIds?: Types.ObjectId[];
  sentAt: Date;
  read: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    targetAudience: {
      type: String,
      required: true,
      enum: ['ALL', 'SPECIFIC', 'RETAILER_ADMIN'],
    },
    targetCustomerIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Customer',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
