const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Local MongoDB connection string
const MONGO_URI = 'mongodb://localhost:27017/byteflow';

async function importDatabase() {
  try {
    console.log('📥 Starting database import...\n');

    // Check if backup directory exists
    const backupDir = path.join(__dirname, 'database-backup');
    if (!fs.existsSync(backupDir)) {
      console.error('❌ Error: database-backup folder not found!');
      console.log('💡 Make sure the database-backup folder is in the backend directory.\n');
      process.exit(1);
    }

    // Connect to Local MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all JSON files from backup directory
    const files = fs.readdirSync(backupDir).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      console.log('⚠️  No backup files found in database-backup folder\n');
      process.exit(0);
    }

    console.log(`📂 Found ${files.length} collection backups to import:\n`);

    let totalDocuments = 0;

    // Import each collection from JSON
    for (const file of files) {
      const collectionName = file.replace('.json', '');
      const filePath = path.join(backupDir, file);
      
      console.log(`⏳ Importing ${collectionName}...`);
      
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const documents = JSON.parse(fileContent);

      if (documents.length > 0) {
        const collection = mongoose.connection.db.collection(collectionName);
        
        // Clear existing data in collection (optional - remove if you want to merge)
        await collection.deleteMany({});
        
        // Insert documents
        await collection.insertMany(documents, { ordered: false });
        console.log(`   ✅ Imported ${documents.length} documents into ${collectionName}`);
        totalDocuments += documents.length;
      } else {
        console.log(`   ⚠️  File ${file} is empty - skipped`);
      }
    }

    console.log(`\n🎉 Import Complete!`);
    console.log(`📊 Total documents imported: ${totalDocuments}`);
    console.log(`📦 Total collections imported: ${files.length}\n`);
    console.log(`✅ Your database is now ready to use!`);

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run import
importDatabase();

