const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Local MongoDB connection string
const MONGO_URI = 'mongodb://localhost:27017/byteflow';

async function exportDatabase() {
  try {
    console.log('📦 Starting database export...\n');

    // Connect to Local MongoDB
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Connected to MongoDB\n');

    // Create backup directory
    const backupDir = path.join(__dirname, 'database-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📂 Found ${collections.length} collections to export:\n`);

    let totalDocuments = 0;

    // Export each collection to JSON
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      const collection = mongoose.connection.db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      if (documents.length > 0) {
        const filePath = path.join(backupDir, `${collectionName}.json`);
        fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
        console.log(`✅ Exported ${documents.length} documents from ${collectionName}`);
        totalDocuments += documents.length;
      } else {
        console.log(`⚠️  Collection ${collectionName} is empty - skipped`);
      }
    }

    console.log(`\n🎉 Export Complete!`);
    console.log(`📊 Total documents exported: ${totalDocuments}`);
    console.log(`📁 Backup location: ${backupDir}\n`);
    console.log(`✅ Database backup files are ready to be shared with your project!`);

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Run export
exportDatabase();

