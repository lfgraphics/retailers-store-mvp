import mongoose from 'mongoose';
import connectDB from '../src/lib/mongodb';
import { seedDatabase } from '../src/lib/seed-service';
import { DEFAULT_RETAILER } from '../src/lib/constants';

async function runSeed() {
  try {
    await connectDB();
    
    console.log('🚀 Starting database seeding...');
    const result = await seedDatabase();
    
    if (result.alreadySeeded) {
      console.log(`ℹ️  ${result.message}`);
    } else {
      console.log(`✅ ${result.message}`);
      console.log(`Username: ${DEFAULT_RETAILER.USERNAME}`);
      console.log(`Password: ${DEFAULT_RETAILER.PASSWORD}`);
      console.log('\n⚠️  Please change the password on first login!');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

runSeed();
