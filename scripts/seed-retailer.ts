import mongoose from 'mongoose';
import Retailer from '../src/models/Retailer';
import connectDB from '../src/lib/mongodb';
import { DEFAULT_RETAILER } from '../src/lib/constants';

async function seedRetailer() {
  try {
    await connectDB();

    console.log('Checking for existing retailer...');

    // Check if retailer already exists
    const existingRetailer = await Retailer.findOne({ username: DEFAULT_RETAILER.USERNAME });

    if (existingRetailer) {
      console.log('⚠️  Retailer already exists, deleting and recreating...');
      await Retailer.deleteOne({ username: DEFAULT_RETAILER.USERNAME });
    }

    console.log('Creating new retailer...');

    // Create default retailer
    const retailer = new Retailer({
      username: DEFAULT_RETAILER.USERNAME,
      password: DEFAULT_RETAILER.PASSWORD,
      isFirstLogin: true,
      storeName: 'My Store',
      storeDescription: 'Welcome to our online store',
    });

    const saved = await retailer.save();
    console.log('Retailer saved with ID:', saved._id);

    // Verify it was saved
    const verify = await Retailer.findOne({ username: DEFAULT_RETAILER.USERNAME });
    if (!verify) {
      throw new Error('Retailer was not saved properly!');
    }

    console.log('✅ Retailer seeded successfully');
    console.log(`Username: ${DEFAULT_RETAILER.USERNAME}`);
    console.log(`Password: ${DEFAULT_RETAILER.PASSWORD}`);
    console.log('\n⚠️  Please change the password on first login!');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding retailer:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seedRetailer();
