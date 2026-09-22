/**
 * Process Single Site CLI
 * 
 * Usage: node process_site.js <site_id>
 * Example: node process_site.js Aja0003
 * 
 * Works identically for any site_id. Zero site-specific logic.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { processSite } from './site_processor.js';

// Load MongoDB URI
const envPath = path.resolve(process.cwd(), '.env.local');
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri && fs.existsSync(envPath)) {
  const match = fs.readFileSync(envPath, 'utf8').match(/MONGODB_URI=["']?([^"'\n]+)/);
  if (match) mongoUri = match[1];
}

async function main() {
  const siteId = process.argv[2];

  if (!siteId) {
    console.error("Usage: node process_site.js <site_id>");
    console.error("Example: node process_site.js Aja0003");
    process.exit(1);
  }

  if (!mongoUri) {
    console.error("MONGODB_URI not found in environment or .env.local");
    process.exit(1);
  }

  console.log(`\n=== MAHARITAGE QUIZ ENGINE — NEW V1 ===`);
  console.log(`Processing single site: ${siteId}\n`);

  await mongoose.connect(mongoUri);
  const Site = mongoose.models.Site || mongoose.model('Site', new mongoose.Schema({}, { strict: false }));

  const siteDoc = await Site.findOne({ site_id: siteId }).lean();

  if (!siteDoc) {
    console.error(`Site '${siteId}' not found in MongoDB`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const report = processSite(siteDoc);

  console.log(`\n=== SITE PROCESSING COMPLETE ===`);
  console.log(`Site: ${report.site_name} (${report.site_id})`);
  console.log(`Text: ${report.text.final_count} | Image: ${report.image.final_count} | Inscription: ${report.inscription.final_count}`);
  console.log(`Total: ${report.totals.total_final} annotations`);
  console.log(`Option Balance: A=${report.totals.option_distribution[0]} B=${report.totals.option_distribution[1]} C=${report.totals.option_distribution[2]} D=${report.totals.option_distribution[3]}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error("Pipeline Error:", err);
  process.exit(1);
});
