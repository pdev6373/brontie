const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Import models
const GiftItem = require('../src/models/GiftItem').default;
const Category = require('../src/models/Category').default;

// Category mapping from old string values to new ObjectIds
const categoryMapping = {
  'Coffee': '68483ef21d38b4b7195d45cd', // Cafés & Treats
  'Food': '68483ef21d38b4b7195d45cd',   // Cafés & Treats
  'Treats': '68483ef21d38b4b7195d45cd', // Cafés & Treats
  'Other': '68483ef21d38b4b7195d45d2'   // Other
};

async function migrateCategories() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all gift items that still have the old 'category' field
    const itemsToMigrate = await GiftItem.find({ 
      category: { $exists: true },
      categoryId: { $exists: false }
    });

    console.log(`Found ${itemsToMigrate.length} items to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const item of itemsToMigrate) {
      try {
        const categoryId = categoryMapping[item.category];
        
        if (!categoryId) {
          console.log(`Unknown category "${item.category}" for item ${item._id}, skipping`);
          errorCount++;
          continue;
        }

        // Update the item to use categoryId instead of category
        await GiftItem.updateOne(
          { _id: item._id },
          { 
            $set: { categoryId: new mongoose.Types.ObjectId(categoryId) },
            $unset: { category: 1 }
          }
        );

        console.log(`Migrated item ${item._id}: ${item.category} -> ${categoryId}`);
        migratedCount++;

      } catch (error) {
        console.error(`Error migrating item ${item._id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\nMigration completed:`);
    console.log(`- Migrated: ${migratedCount} items`);
    console.log(`- Errors: ${errorCount} items`);

    // Verify migration
    const remainingOldItems = await GiftItem.find({ 
      category: { $exists: true }
    });
    
    const newItems = await GiftItem.find({ 
      categoryId: { $exists: true }
    });

    console.log(`\nVerification:`);
    console.log(`- Items with old 'category' field: ${remainingOldItems.length}`);
    console.log(`- Items with new 'categoryId' field: ${newItems.length}`);

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run migration
migrateCategories();
