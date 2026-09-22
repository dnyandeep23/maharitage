const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

if (!process.env.MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is required.");
  process.exit(1);
}
const uri = process.env.MONGODB_URI;

const DATASET_DIR = path.join(__dirname, '..', 'dataset');
if (!fs.existsSync(DATASET_DIR)) fs.mkdirSync(DATASET_DIR, { recursive: true });
const STATE_FILE = path.join(DATASET_DIR, 'generation_state.json');

async function run() {
  let dbConnection;
  try {
    dbConnection = await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const sitesCollection = db.collection('sites');

    const sites = await sitesCollection.aggregate([
      { $match: { gallary: { $exists: true, $not: { $size: 0 } } } },
      { $sample: { size: 15 } }
    ]).toArray();

    const state = [];

    for (const site of sites) {
      let imagesToProcess = [site.gallary[0]];
      if (site.gallary.length > 1) {
        imagesToProcess.push(site.gallary[1]);
      }

      for (let i = 0; i < imagesToProcess.length; i++) {
        const imageUrl = imagesToProcess[i];
        
        state.push({
          image_id: `${site.site_id}_img_${i}`,
          site_id: site.site_id,
          image_url: imageUrl,
          status: 'PENDING',
          candidates_generated: 0,
          accepted: 0,
          rejected: 0,
          last_attempt: null,
          error: null,
          retry_count: 0
        });
      }
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`Initialized generation_state.json with ${state.length} pending images.`);
  } catch (error) {
    console.error("Initialization Error:", error);
  } finally {
    if (dbConnection) await mongoose.disconnect();
  }
}

run();
