/**
 * discover_all_assets_v2.js
 * Scans every MongoDB collection for any Cloudinary URL strings (including those without file extensions).
 * Normalizes URLs, extracts public IDs, de‑duplicates, removes any that overlap with frozen evaluation assets.
 * Produces an extended asset catalog and a markdown gate report.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ASSETS_DIR = path.resolve(ROOT, 'src/ai/quiz-engine/v1/training/assets');
fs.mkdirSync(ASSETS_DIR, { recursive: true });

// Helper utilities -------------------------------------------------
function normalizeUrl(url) {
  if (!url) return '';
  // Strip query params & version segment
  return url.split('?')[0].replace(/\/v\d+\//, '/').toLowerCase().trim();
}
function extractPubId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w{2,4})?$/);
  return m ? m[1].toLowerCase() : null;
}
function collectUrls(obj, prefix = '') {
  const res = [];
  if (!obj) return res;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => res.push(...collectUrls(v, `${prefix}[${i}]`)));
    return res;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const cur = prefix ? `${prefix}.${k}` : k;
      if (typeof v === 'string' && v.includes('cloudinary.com')) {
        res.push({ url: v, field: cur });
      } else if (typeof v === 'object') {
        res.push(...collectUrls(v, cur));
      }
    }
    return res;
  }
  return res;
}

// Load evaluation registry (V4 + hard‑diagnostic) ----------------
function loadEvalRegistry() {
  const evalUrls = new Set();
  const evalPubIds = new Set();
  const v4Path = path.resolve(ROOT, 'src/ai/quiz-engine/v1/baseline/independent/v4_gallery_items.json');
  const diagPath = path.resolve(ROOT, 'src/ai/quiz-engine/data/benchmarks/visual_gold/hard_image_diagnostic/questions/hard_image_diagnostic.json');
  const v4 = JSON.parse(fs.readFileSync(v4Path, 'utf8'));
  const diag = JSON.parse(fs.readFileSync(diagPath, 'utf8'));
  v4.forEach(i => { evalUrls.add(normalizeUrl(i.url)); const pid = extractPubId(i.url); if (pid) evalPubIds.add(pid); });
  diag.forEach(i => { const u = i.image_url || ''; evalUrls.add(normalizeUrl(u)); const pid = extractPubId(u); if (pid) evalPubIds.add(pid); });
  return { evalUrls, evalPubIds };
}

async function main() {
  console.log('\n=== Full MongoDB Asset Scan (v2) ===');
  const envPath = path.resolve(ROOT, '.env.local');
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri && fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, 'utf8').match(/MONGODB_URI=[\"']?([^\"'\n]+)/);
    if (match) mongoUri = match[1];
  }
  if (!mongoUri) { console.error('MongoDB URI not found'); process.exit(1); }
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  const { evalUrls, evalPubIds } = loadEvalRegistry();

  const allFound = [];
  for (const { name: collName } of collections) {
    const docs = await db.collection(collName).find({}).toArray();
    for (const doc of docs) {
      const siteId = doc.site_id || doc._id?.toString() || 'UNKNOWN';
      const urls = collectUrls(doc);
      for (const { url, field } of urls) {
        const norm = normalizeUrl(url);
        const pub = extractPubId(url);
        const isEval = evalUrls.has(norm) || (pub && evalPubIds.has(pub));
        // Heuristic classification
        let assetType = 'OTHER';
        const lcField = field.toLowerCase();
        if (/(gallery|cave|fort|site|image)/.test(lcField)) assetType = 'GALLERY';
        if (/insc|inscription/.test(lcField) || /insc|inscription/.test(url.toLowerCase())) assetType = 'INSCRIPTION';
        allFound.push({
          collection: collName,
          site_id: siteId,
          url,
          normalized_url: norm,
          cloudinary_public_id: pub,
          field,
          asset_type: assetType,
          is_evaluation_asset: isEval
        });
      }
    }
  }

  await mongoose.disconnect();

  // Deduplicate – key: public ID if present else normalized URL
  const uniqMap = new Map();
  for (const item of allFound) {
    const key = item.cloudinary_public_id || item.normalized_url;
    if (!uniqMap.has(key)) uniqMap.set(key, item);
  }
  const uniqueAssets = Array.from(uniqMap.values());
  const cleanAssets = uniqueAssets.filter(a => !a.is_evaluation_asset);

  // Statistics
  const stats = { total_scanned: allFound.length, unique_assets: uniqueAssets.length, clean_assets: cleanAssets.length, by_type: { GALLERY: 0, INSCRIPTION: 0, OTHER: 0 }, by_site: {} };
  for (const a of cleanAssets) {
    stats.by_type[a.asset_type] = (stats.by_type[a.asset_type] || 0) + 1;
    stats.by_site[a.site_id] = (stats.by_site[a.site_id] || 0) + 1;
  }

  // Write extended catalog
  const catalogPath = path.join(ASSETS_DIR, 'asset_catalog_v2.json');
  fs.writeFileSync(catalogPath, JSON.stringify({ generated_at: new Date().toISOString(), total_scanned: allFound.length, unique_assets: uniqueAssets.length, clean_assets: cleanAssets.length, assets: cleanAssets }, null, 2));

  // Write markdown gate report
  const reportPath = path.join(ASSETS_DIR, 'asset_gate_report_v2.md');
  const md = `# Extended Asset Gate Report (v2)\n\n**TOTAL_SCANNED_ASSETS**: ${stats.total_scanned}\n**UNIQUE_ASSETS**: ${stats.unique_assets}\n**CLEAN_TRAINING_CANDIDATES**: ${stats.clean_assets}\n**TARGET**: 110 (minimum 100)\n**SHORTFALL**: ${Math.max(0, 110 - stats.clean_assets)}\n\n## By Type\n| Type | Count |\n|------|-------|\n| GALLERY | ${stats.by_type.GALLERY} |\n| INSCRIPTION | ${stats.by_type.INSCRIPTION} |\n| OTHER | ${stats.by_type.OTHER} |\n\n## Top Sites (by count)\n${Object.entries(stats.by_site).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([s,c])=>`- ${s}: ${c}`).join('\n')}\n\n**IMAGE_LEAKAGE**: 0 / ${stats.clean_assets} (verified against evaluation registry)\n`;
  fs.writeFileSync(reportPath, md);

  console.log('\n=== Scan Complete ===');
  console.log(`Total scanned entries (including duplicates): ${stats.total_scanned}`);
  console.log(`Unique assets: ${stats.unique_assets}`);
  console.log(`Clean training candidates: ${stats.clean_assets}`);
  console.log(`Shortfall to 110: ${Math.max(0, 110 - stats.clean_assets)}`);
  console.log(`Report written to ${reportPath}`);
}

main().catch(err => { console.error(err); process.exit(1); });
