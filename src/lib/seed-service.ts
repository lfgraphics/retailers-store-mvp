import Retailer from '@/models/Retailer';
import Admin from '@/models/Admin';
import SystemConfig from '@/models/SystemConfig';
import { DEFAULT_RETAILER } from '@/lib/constants';

export async function seedDatabase() {
  try {
    // 1. Check if already seeded via SystemConfig
    // Note: We bypass this check to ensure Admin/Retailer structure is correct during development
    /*
    const seedConfig = await SystemConfig.findOne({ key: 'is_seeded' });
    if (seedConfig && seedConfig.value === true) {
      return {
        success: true,
        message: 'Database is already seeded.',
        alreadySeeded: true
      };
    }
    */

    // 2. Create Store Profile (Retailer) if not exists
    let retailer = await Retailer.findOne();
    if (!retailer) {
      console.log('Creating default store profile...');
      retailer = new Retailer({
        storeName: 'My Store',
        storeDescription: 'Welcome to our online store',
        onlinePaymentEnabled: false,
        defaultDeliveryCharge: 0,
      });
      await retailer.save();
    }

    // 3. Create Super Admin if not exists
    const existingAdmin = await Admin.findOne({ username: DEFAULT_RETAILER.USERNAME });
    if (!existingAdmin) {
      console.log('Creating super admin...');
      const admin = new Admin({
        username: DEFAULT_RETAILER.USERNAME,
        password: DEFAULT_RETAILER.PASSWORD,
        name: 'Super Admin',
        role: 'super_admin',
      });
      await admin.save();
    }

    // 4. Mark as seeded in SystemConfig
    await SystemConfig.findOneAndUpdate(
      { key: 'is_seeded' },
      { value: true },
      { upsert: true, new: true }
    );

    return {
      success: true,
      message: 'Database seeded successfully.',
      alreadySeeded: false
    };
  } catch (error: unknown) {
    console.error('Error in seedDatabase:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Seeding failed: ${errorMessage}`);
  }
}
