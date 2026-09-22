/**
 * discover_all_assets.js
 * Scans *all* MongoDB collections for Cloudinary image URLs.
 * Normalizes URLs, extracts public IDs, removes any that overlap with frozen evaluation assets.
 * Generates an extended asset catalog and a gate report.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const ASSETS_DIR = path.resolve(ROOT, 'src/ai/quiz-engine/v1/training/assets');
fs.mkdirSync(ASSETS_DIR, { recursive: true });

// Helper funcs ---------------------------------------------------
function normalizeUrl(url) {
  if (!url) return '';
  return url.split('?')[0].replace(/\/v\d+\//, '/').toLowerCase().trim();
}
function extractPubId(url) {
  const m = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w{2,4})?$/);
  return m ? m[1].toLowerCase() : null;
}
function isImageUrl(url) {
  return /\.(jpe?g|png|webp|gif)(?:[?#]|$)/i.test(url);
}
// Recursively pull any strings containing cloudinary.com
function collectUrls(obj, pathPrefix = '') {
  const results = [];
  if (!obj) return results;
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => results.push(...collectUrls(v, `${pathPrefix}[${i}]`)));
    return results;
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      const curPath = pathPrefix ? `${pathPrefix}.${k}` : k;
      if (typeof v === 'string' && v.includes('cloudinary.com')) {
        results.push({ url: v, field: curPath });
      } else if (typeof v === 'object') {
        results.push(...collectUrls(v, curPath));
      }
    }
    return results;
  }
  return results;
}

// Load evaluation registries (same as previous scripts) ----------
function loadEvalRegistry() {
  const evalUrls = new Set();
  const evalPubIds = new Set();
  const v4Path = path.resolve(ROOT, 'src/ai/quiz-engine/v1/baseline/independent/v4_gallery_items.json');
  const diagPath = path.resolve(ROOT, 'src/ai/quiz-engine/data/benchmarks/visual_gold/hard_image_diagnostic/questions/hard_image_diagnostic.json');
  const load = p => JSON.parse(fs.readFileSync(p, 'utf8'));
  const v4 = load(v4Path);
  const diag = load(diagPath);
  v4.forEach(i => { evalUrls.add(normalizeUrl(i.url)); const pid = extractPubId(i.url); if (pid) evalPubIds.add(pid); });
  diag.forEach(i => { const u = i.image_url || ''; evalUrls.add(normalizeUrl(u)); const pid = extractPubId(u); if (pid) evalPubIds.add(pid); });
  return { evalUrls, evalPubIds };
}

async function discoverAll() {
  console.log('\n=== Full MongoDB Asset Discovery ===');
  const envPath = path.resolve(ROOT, '.env.local');
  let mongoUri = process.env.MONGODB_URI;
  if (!mongoUri && fs.existsSync(envPath)) {
    const match = fs.readFileSync(envPath, 'utf8').match(/MONGODB_URI=[\"']?([^\"'\n]+)/);
    if (match) mongoUri = match[1];
  }
  if (!mongoUri) {
    console.error('MongoDB URI not found');
    process.exit(1);
  }
  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const { evalUrls, evalPubIds } = loadEvalRegistry();

  const allFound = [];
  for (const collInfo of collections) {
    const collName = collInfo.name;
    const docs = await db.collection(collName).find({}).toArray();
    for (const doc of docs) {
      const siteId = doc.site_id || doc._id?.toString() || 'UNKNOWN';
      const urls = collectUrls(doc); // collect all cloudinary strings
      urls.forEach(({ url, field }) => {
        if (!isImageUrl(url)) return; // keep only real image URLs
        const norm = normalizeUrl(url);
        const pub = extractPubId(url);
        const isEval = evalUrls.has(norm) || (pub && evalPubIds.has(pub));
        allFound.push({
          collection: collName,
          site_id: siteId,
          url,
          normalized_url: norm,
          cloudinary_public_id: pub,
          field,
          is_evaluation_asset: isEval,
          asset_type: /gallery|cave|fort|insc|inscription|image/i.test(field) ? ( /gallery|cave|fort/i.test(field) ? 'GALLERY' : ( /insc|inscription/i.test(field) ? 'INSCRIPTION' : 'OTHER')) : 'OTHER'
        });
      });
    }
  }

  await mongoose.disconnect();

  // Deduplicate by normalized URL (or public ID fallback)
  const uniqMap = new Map();
  allFound.forEach(item => {
    const key = item.cloudinary_public_id || item.normalized_url;
    if (!uniqMap.has(key)) uniqMap.set(key, item);
  });
  const uniqueAssets = Array.from(uniqMap.values());

  const cleanAssets = uniqueAssets.filter(a => !a.is_evaluation_asset);
  const counts = {
    total_discovered: allFound.length,
    unique_assets: uniqueAssets.length,
    clean_assets: cleanAssets.length,
    by_type: { GALLERY: 0, INSCRIPTION: 0, OTHER: 0 },
    by_site: {}
  };
  cleanAssets.forEach(a => {
    counts.by_type[a.asset_type] = (counts.by_type[a.asset_type] || 0) + 1;
    counts.by_site[a.site_id] = (counts.by_site[a.site_id] || 0) + 1;
  });

  // Write catalogs
  const catalogPath = path.join(ASSETS_DIR, 'asset_catalog_extended.json');
  fs.writeFileSync(catalogPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    total_discovered: allFound.length,
    unique_assets: uniqueAssets.length,
    clean_assets: cleanAssets.length,
    assets: cleanAssets
  }, null, 2));

  // Write gate report (markdown)
  const reportPath = path.join(ASSETS_DIR, 'asset_gate_report_extended.md');
  const md = `# Extended Asset Gate Report

**TOTAL_DISCOVERED_ASSETS**: ${allFound.length}
**UNIQUE_ASSETS**: ${uniqueAssets.length}
**CLEAN_TRAINING_CANDIDATES**: ${cleanAssets.length}
**TARGET**: 110 (minimum 100)
**SHORTFALL**: ${Math.max(0, 110 - cleanAssets.length)}

## By Type
| Type | Count |
|------|-------|
| GALLERY | ${counts.by_type.GALLERY} |
| INSCRIPTION | ${counts.by_type.INSCRIPTION} |
| OTHER | ${counts.by_type.OTHER} |

## By Site (top 10)
${Object.entries(counts.by_site).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([s,c])=>`- ${s}: ${c}`).join('\n')}

**IMAGE_LEAKAGE**: 0 / ${cleanAssets.length} (verified against evaluation registry)

`;
  fs.writeFileSync(reportPath, md);

  console.log('\n=== Discovery Complete ===');
  console.log(`Total assets scanned (including duplicates): ${allFound.length}`);
  console.log(`Unique assets (by URL/public ID): ${uniqueAssets.length}`);
  console.log(`Clean training candidates: ${cleanAssets.length}`);
  console.log(`Shortfall to 110: ${Math.max(0, 110 - cleanAssets.length)}`);
  console.log(`Report saved to ${reportPath}`);
}

discoverAll().catch(err => { console.error(err); process.exit(1); });
