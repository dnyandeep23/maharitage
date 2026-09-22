import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri && fs.existsSync(envPath)) {
  const match = fs.readFileSync(envPath, 'utf8').match(/MONGODB_URI=["']?([^"'\n]+)/);
  if (match) mongoUri = match[1];
}

async function checkInscUrl() {
  await mongoose.connect(mongoUri);
  const Site = mongoose.models.Site || mongoose.model('Site', new mongoose.Schema({}, { strict: false }));
  const sites = await Site.find({}).lean();
  sites.forEach(s => {
    (s.inscriptions || []).slice(0, 3).forEach(i => {
      console.log(`Site ${s.site_id} Inscription keys:`, Object.keys(i));
      console.log(`  Sample item:`, i);
    });
  });
  await mongoose.disconnect();
}
checkInscUrl();
