/**
 * Process ALL Sites CLI
 * 
 * Usage: node process_all_sites.js
 * 
 * Fetches ALL heritage sites from MongoDB, processes each through
 * the generic site processor, and generates per-site + global reports.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { processSite } from './site_processor.js';
import { toCleanString } from '../verification/mongodb_verifier.js';

// Load MongoDB URI
const envPath = path.resolve(process.cwd(), '.env.local');
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri && fs.existsSync(envPath)) {
  const match = fs.readFileSync(envPath, 'utf8').match(/MONGODB_URI=["']?([^"'\n]+)/);
  if (match) mongoUri = match[1];
}

async function main() {
  if (!mongoUri) {
    console.error("MONGODB_URI not found in environment or .env.local");
    process.exit(1);
  }

  console.log(`\n════════════════════════════════════════════════`);
  console.log(`  MAHARITAGE QUIZ ENGINE — NEW V1`);
  console.log(`  PROCESS ALL SITES`);
  console.log(`════════════════════════════════════════════════\n`);

  await mongoose.connect(mongoUri);
  const Site = mongoose.models.Site || mongoose.model('Site', new mongoose.Schema({}, { strict: false }));

  const sites = await Site.find({}).lean();

  if (!sites || sites.length === 0) {
    console.error("No heritage sites found in MongoDB");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found ${sites.length} heritage sites in MongoDB.\n`);

  const reports = [];
  const failures = [];

  for (let i = 0; i < sites.length; i++) {
    const siteDoc = sites[i];
    const siteId = toCleanString(siteDoc.site_id, `site_${i}`);
    console.log(`\n[${i + 1}/${sites.length}] Processing ${siteId}...`);

    try {
      const report = processSite(siteDoc);
      reports.push(report);
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      failures.push({ site_id: siteId, error: err.message });
    }
  }

  // Generate global report
  const globalReport = generateGlobalReport(reports, failures, sites.length);
  const reportsDir = path.resolve(process.cwd(), 'src/ai/quiz-engine/data/annotations/reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir, 'global_report.md'), globalReport);

  // Print summary
  const totalText = reports.reduce((s, r) => s + r.text.final_count, 0);
  const totalImage = reports.reduce((s, r) => s + r.image.final_count, 0);
  const totalInscription = reports.reduce((s, r) => s + r.inscription.final_count, 0);
  const totalAll = totalText + totalImage + totalInscription;

  console.log(`\n════════════════════════════════════════════════`);
  console.log(`  ALL SITES PROCESSING COMPLETE`);
  console.log(`════════════════════════════════════════════════`);
  console.log(`  Sites processed: ${reports.length}/${sites.length}`);
  console.log(`  Sites failed:    ${failures.length}`);
  console.log(`  Text MCQs:       ${totalText}`);
  console.log(`  Image MCQs:      ${totalImage}`);
  console.log(`  Inscription MCQs: ${totalInscription}`);
  console.log(`  TOTAL:           ${totalAll}`);
  console.log(`════════════════════════════════════════════════\n`);

  await mongoose.disconnect();
}

function generateGlobalReport(reports, failures, totalSites) {
  const totalText = reports.reduce((s, r) => s + r.text.final_count, 0);
  const totalImage = reports.reduce((s, r) => s + r.image.final_count, 0);
  const totalInscription = reports.reduce((s, r) => s + r.inscription.final_count, 0);
  const totalAll = totalText + totalImage + totalInscription;
  const totalGenerated = reports.reduce((s, r) => s + r.totals.total_generated, 0);
  const totalRejected = reports.reduce((s, r) => s + r.totals.total_rejected, 0);
  const totalDuplicates = reports.reduce((s, r) => s + r.totals.total_duplicates, 0);

  // Global option distribution
  const globalDist = { 0: 0, 1: 0, 2: 0, 3: 0 };
  reports.forEach(r => {
    const d = r.totals.option_distribution;
    if (d) { globalDist[0] += d[0] || 0; globalDist[1] += d[1] || 0; globalDist[2] += d[2] || 0; globalDist[3] += d[3] || 0; }
  });

  let md = `# Global Validation Report — MAHARITAGE QUIZ ENGINE NEW V1

**Total Sites in MongoDB**: ${totalSites}
**Sites Processed**: ${reports.length}
**Sites Failed**: ${failures.length}

---

## Per-Site Summary

| Site ID | Site Name | Type | Text | Image | Inscription | Total |
|:---|:---|:---|:---:|:---:|:---:|:---:|
`;

  for (const r of reports) {
    md += `| ${r.site_id} | ${r.site_name} | ${r.heritage_type} | ${r.text.final_count} | ${r.image.final_count} | ${r.inscription.final_count} | **${r.totals.total_final}** |\n`;
  }

  md += `| **TOTAL** | | | **${totalText}** | **${totalImage}** | **${totalInscription}** | **${totalAll}** |\n`;

  md += `
---

## Aggregate Metrics

| Metric | Count |
|:---|:---:|
| Total Generated | ${totalGenerated} |
| Total Validated & Final | ${totalAll} |
| Total Rejected | ${totalRejected} |
| Total Duplicates Removed | ${totalDuplicates} |

---

## Global Option Position Distribution

| Position | Count | Percentage |
|:---:|:---:|:---:|
| A (0) | ${globalDist[0]} | ${totalAll > 0 ? ((globalDist[0] / totalAll) * 100).toFixed(1) : 0}% |
| B (1) | ${globalDist[1]} | ${totalAll > 0 ? ((globalDist[1] / totalAll) * 100).toFixed(1) : 0}% |
| C (2) | ${globalDist[2]} | ${totalAll > 0 ? ((globalDist[2] / totalAll) * 100).toFixed(1) : 0}% |
| D (3) | ${globalDist[3]} | ${totalAll > 0 ? ((globalDist[3] / totalAll) * 100).toFixed(1) : 0}% |
`;

  if (failures.length > 0) {
    md += `\n---\n\n## Failed Sites\n\n`;
    for (const f of failures) {
      md += `- **${f.site_id}**: ${f.error}\n`;
    }
  }

  return md;
}

main().catch(err => {
  console.error("Pipeline Error:", err);
  process.exit(1);
});
