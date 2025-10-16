// Migration script to copy addressLine1 to address field
// Run this once to migrate existing data before deploying the address field changes

require('dotenv').config();
const mongoose = require('mongoose');

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const migrateAddressField = async () => {
  try {
    await connectToDatabase();
    
    // Get all merchant locations that have addressLine1 but no address
    const result = await mongoose.connection.db.collection('merchantlocations').updateMany(
      { 
        addressLine1: { $exists: true },
        address: { $exists: false }
      },
      [
        {
          $set: {
            address: '$addressLine1'
          }
        }
      ]
    );
    
    console.log(`Migration completed. Updated ${result.modifiedCount} documents.`);
    
    // Verify the migration
    const countWithBothFields = await mongoose.connection.db.collection('merchantlocations').countDocuments({
      addressLine1: { $exists: true },
      address: { $exists: true }
    });
    
    console.log(`Verification: ${countWithBothFields} documents now have both fields.`);
    
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

// Run the migration
migrateAddressField();
