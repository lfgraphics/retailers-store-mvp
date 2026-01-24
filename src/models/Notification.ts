import mongoose, { Schema, Document, Types } from 'mongoose';
import { NotificationAudience } from '@/lib/constants';

export interface INotification extends Document {
  title: string;
  message: string;
  image?: string;
  targetAudience: NotificationAudience;
  targetCustomerIds?: Types.ObjectId[];
  sentAt: Date;
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
      enum: ['ALL', 'SPECIFIC'],
    },
    targetCustomerIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Customer',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
