import webpush from 'web-push';
import Notification from '@/models/Notification';
import Retailer from '@/models/Retailer';
import Customer from '@/models/Customer';
import { Types } from 'mongoose';

// Initialize web-push
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@example.com',
    vapidPublicKey,
    vapidPrivateKey
  );
}

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  image?: string;
}

export interface NotificationTarget {
  userId?: string | Types.ObjectId; // For DB tracking
  role: 'retailer' | 'customer';
}

/**
 * Send notification to a specific user (Retailer or Customer)
 * Stores in DB and sends Web Push if subscribed
 */
export async function sendNotification(
  target: NotificationTarget,
  payload: NotificationPayload
) {
  try {
    // 1. Store in Database
    // Note: The current Notification model seems designed for broadcast/marketing (targetAudience).
    // We might need a separate model for transactional alerts or adapt the existing one.
    // For now, let's focus on the Web Push delivery which is the primary requirement.
    
    // If we want to persist in-app notifications for users, we should probably add them to a collection.
    // Let's create a transactional notification record if we have a userId.
    if (target.userId || target.role === 'retailer') {
       const notificationData: any = {
         title: payload.title,
         message: payload.body,
         image: payload.image,
         targetAudience: 'SPECIFIC',
       };

       if (target.role === 'customer' && target.userId) {
         notificationData.targetCustomerIds = [target.userId];
       } else if (target.role === 'retailer') {
         notificationData.targetAudience = 'RETAILER_ADMIN';
       }

       const notification = new Notification(notificationData);
       await notification.save();
    }

    // 2. Send Web Push
    let subscriptions: any[] = [];

    if (target.role === 'retailer') {
      // Fetch Retailer (Store Profile) subscriptions
      // Since it's a single retailer app, we notify all registered endpoints on the Retailer doc
      const retailer = await Retailer.findOne().select('pushSubscriptions');
      if (retailer?.pushSubscriptions) {
        subscriptions = retailer.pushSubscriptions;
      }
    } else if (target.role === 'customer' && target.userId) {
      // Fetch Customer subscriptions
      const customer = await Customer.findById(target.userId).select('pushSubscriptions');
      if (customer?.pushSubscriptions) {
        subscriptions = customer.pushSubscriptions;
      }
    }

    if (subscriptions.length === 0) return;

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || '/',
      icon: payload.icon || '/icons/icon-192x192.png',
      image: payload.image,
    });

    const sendPromises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub, pushPayload);
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired/gone, remove it
          if (target.role === 'retailer') {
            await Retailer.updateOne({}, { $pull: { pushSubscriptions: sub } });
          } else if (target.userId) {
            await Customer.findByIdAndUpdate(target.userId, { $pull: { pushSubscriptions: sub } });
          }
        }
        // console.error('Push send error:', error);
      }
    });

    await Promise.all(sendPromises);
    
  } catch (error) {
    console.error('Notification Service Error:', error);
  }
}

/**
 * Broadcast notification to all Retailer Admins
 */
export async function notifyRetailer(payload: NotificationPayload) {
  return sendNotification({ role: 'retailer' }, payload);
}

/**
 * Notify a specific customer
 */
export async function notifyCustomer(customerId: string | Types.ObjectId, payload: NotificationPayload) {
  return sendNotification({ role: 'customer', userId: customerId }, payload);
}
