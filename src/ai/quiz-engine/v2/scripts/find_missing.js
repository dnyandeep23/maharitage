const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const DATASET_DIR = '/Users/dnyandeep/Dnyandeep/Project/maharitage/src/ai/quiz-engine/v2/dataset';

function loadJsonArray(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch(e) {
    return [];
  }
}

function extractUrls(obj, found = []) {
  if (!obj) return found;
  if (typeof obj === 'string') { if (obj.includes('cloudinary.com') && (obj.endsWith('.jpg') || obj.endsWith('.png') || obj.endsWith('.jpeg'))) found.push(obj); }
  else if (Array.isArray(obj)) { obj.forEach(item => extractUrls(item, found)); }
  else if (typeof obj === 'object') { for (const key in obj) extractUrls(obj[key], found); }
  return found;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const sites = await db.collection('sites').find({}).toArray();
  
  for (const site of sites) {
    const siteId = site.site_id;
    const IMG_ANN = path.join(DATASET_DIR, siteId, 'image', 'annotations.json');
    const allImg = loadJsonArray(IMG_ANN);
    const rawUrls = Array.from(new Set(extractUrls(site)));
    
    const imageGroups = {};
    allImg.forEach(a => {
      if(a.image_url) {
        imageGroups[a.image_url] = (imageGroups[a.image_url] || 0) + 1;
      }
    });
    
    let imagesComplete = 0;
    rawUrls.forEach(u => {
      if ((imageGroups[u] || 0) >= 5) imagesComplete++;
    });
    const pendingUrls = rawUrls.filter(u => (imageGroups[u] || 0) < 5);
    if (pendingUrls.length > 0) {
      console.log(`\n--- MISSING IMAGES FOR ${siteId} ---`);
      pendingUrls.forEach(u => console.log(u));
    }
  }
  
  await mongoose.disconnect();
}

run().catch(console.error);
