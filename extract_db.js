import mongoose from 'mongoose';
import fs from 'fs';

const uri = "mongodb+srv://maharitage:Maharitage@cluster0.h05toky.mongodb.net/maharitage?retryWrites=true&w=majority&appName=Cluster0";

async function extract() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const sites = db.collection('sites');

    const allSites = await sites.find({}).toArray();
    
    // Save to scratch
    fs.writeFileSync('/Users/dnyandeep/.gemini/antigravity-ide/brain/4e283323-cd1f-4b85-9fb2-6065844cc69c/scratch/sites_dump.json', JSON.stringify(allSites, null, 2));
    console.log(`Extracted ${allSites.length} sites to scratch/sites_dump.json`);
  } catch (error) {
    console.error("Error extracting from MongoDB:", error);
  } finally {
    await mongoose.disconnect();
  }
}

extract();
