import Retailer from '@/models/Retailer';
import SystemConfig from '@/models/SystemConfig';
import { DEFAULT_RETAILER } from '@/lib/constants';

export async function seedDatabase() {
  try {
    // 1. Check if already seeded via SystemConfig
    const seedConfig = await SystemConfig.findOne({ key: 'is_seeded' });
    if (seedConfig && seedConfig.value === true) {
      return {
        success: true,
        message: 'Database is already seeded.',
        alreadySeeded: true
      };
    }

    // 2. Check if default retailer exists as a fallback check
    const existingRetailer = await Retailer.findOne({ username: DEFAULT_RETAILER.USERNAME });
    if (existingRetailer) {
      // If retailer exists but config doesn't, update config and return
      if (!seedConfig) {
        await SystemConfig.create({ key: 'is_seeded', value: true });
      }
      return {
        success: true,
        message: 'Database is already seeded (retailer found).',
        alreadySeeded: true
      };
    }

    // 3. Perform seeding
    console.log('Creating default retailer...');
    const retailer = new Retailer({
      username: DEFAULT_RETAILER.USERNAME,
      password: DEFAULT_RETAILER.PASSWORD,
      isFirstLogin: true,
      storeName: 'My Store',
      storeDescription: 'Welcome to our online store',
    });

    await retailer.save();

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
