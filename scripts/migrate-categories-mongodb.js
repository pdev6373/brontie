// MongoDB migration script to convert category field to categoryId
// Run this in MongoDB Compass or mongo shell

// First, let's see what we have
print("=== Current Gift Items with 'category' field ===");
db.giftitems.find({ category: { $exists: true } }).forEach(function(item) {
  print(`ID: ${item._id}, Category: ${item.category}, Name: ${item.name}`);
});

print("\n=== Current Categories ===");
db.categories.find({}).forEach(function(cat) {
  print(`ID: ${cat._id}, Name: ${cat.name}, Slug: ${cat.slug}`);
});

// Category mapping
const categoryMapping = {
  'Coffee': ObjectId('68483ef21d38b4b7195d45cd'), // Cafés & Treats
  'Food': ObjectId('68483ef21d38b4b7195d45cd'),   // Cafés & Treats  
  'Treats': ObjectId('68483ef21d38b4b7195d45cd'), // Cafés & Treats
  'Other': ObjectId('68483ef21d38b4b7195d45d2')   // Other
};

print("\n=== Starting Migration ===");

// Update items with 'Coffee' category
db.giftitems.updateMany(
  { category: 'Coffee' },
  { 
    $set: { categoryId: ObjectId('68483ef21d38b4b7195d45cd') },
    $unset: { category: 1 }
  }
);

// Update items with 'Food' category
db.giftitems.updateMany(
  { category: 'Food' },
  { 
    $set: { categoryId: ObjectId('68483ef21d38b4b7195d45cd') },
    $unset: { category: 1 }
  }
);

// Update items with 'Treats' category
db.giftitems.updateMany(
  { category: 'Treats' },
  { 
    $set: { categoryId: ObjectId('68483ef21d38b4b7195d45cd') },
    $unset: { category: 1 }
  }
);

// Update items with 'Other' category
db.giftitems.updateMany(
  { category: 'Other' },
  { 
    $set: { categoryId: ObjectId('68483ef21d38b4b7195d45d2') },
    $unset: { category: 1 }
  }
);

print("\n=== Migration Complete ===");

// Verify results
print("Items with old 'category' field:");
print(db.giftitems.countDocuments({ category: { $exists: true } }));

print("Items with new 'categoryId' field:");
print(db.giftitems.countDocuments({ categoryId: { $exists: true } }));

print("\n=== Updated Gift Items ===");
db.giftitems.find({ categoryId: { $exists: true } }).forEach(function(item) {
  print(`ID: ${item._id}, CategoryId: ${item.categoryId}, Name: ${item.name}`);
});
