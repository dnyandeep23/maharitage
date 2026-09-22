/**
 * Asset Discovery Script
 * Recursively scans MongoDB for all image/cloudinary URLs across all site fields.
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const ASSETS_DIR = path.resolve(ROOT, 'src/ai/quiz-engine/v1/training/assets');
fs.mkdirSync(ASSETS_DIR, { recursive: true });

const envPath = path.join(ROOT, '.env.local');
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri && fs.existsSync(envPath)) {
  const match = fs.readFileSync(envPath, 'utf8').match(/MONGODB_URI=["']?([^"'\n]+)/);
  if (match) mongoUri = match[1];
}

function extractCloudinaryPublicId(url) {
  if (!url) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w{2,4})?$/);
  return match ? match[1] : null;
}

function normalizeUrl(url) {
  if (!url) return '';
  return url.split('?')[0].replace(/\/v\d+\//, '/').toLowerCase().trim();
}

function extractAllImageUrls(obj, fieldPath = '', results = []) {
  if (!obj || typeof obj !== 'object') return results;
  if (Array.isArray(obj)) {
    obj.forEach((item, idx) => extractAllImageUrls(item, `${fieldPath}[${idx}]`, results));
    return results;
  }
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string' && (value.includes('cloudinary.com') || value.includes('res.cloudinary'))) {
      results.push({ url: value, field: `${fieldPath}.${key}` });
    } else if (typeof value === 'object') {
      extractAllImageUrls(value, `${fieldPath}.${key}`, results);
    }
  }
  return results;
}

async function discoverAssets() {
  console.log('\n════════════════════════════════════════════════');
  console.log('  ASSET DISCOVERY — FULL MONGODB SCAN');
  console.log('════════════════════════════════════════════════\n');

  await mongoose.connect(mongoUri);
  const Site = mongoose.models.Site || mongoose.model('Site', new mongoose.Schema({}, { strict: false }));
  const sites = await Site.find({}).lean();

  const allAssets = [];
  const seen = new Set();

  sites.forEach(siteDoc => {
    const siteId = siteDoc.site_id;
    const siteName = siteDoc.site_name;

    // Deep scan for all cloudinary URLs
    const found = extractAllImageUrls(siteDoc, siteId);

    found.forEach(({ url, field }) => {
      const normUrl = normalizeUrl(url);
      const publicId = extractCloudinaryPublicId(url);
      const key = publicId || normUrl;

      let assetType = 'OTHER';
      if (field.toLowerCase().includes('gallary') || field.toLowerCase().includes('gallery')) {
        assetType = 'GALLERY';
      } else if (field.toLowerCase().includes('inscription') || field.toLowerCase().includes('insc_')) {
        assetType = 'INSCRIPTION';
      }

      allAssets.push({
        site_id: siteId,
        site_name: siteName,
        url,
        normalized_url: normUrl,
        cloudinary_public_id: publicId,
        field,
        asset_type: assetType,
        is_unique: !seen.has(key)
      });

      seen.add(key);
    });
  });

  const uniqueAssets = allAssets.filter(a => a.is_unique);
  const galleryAssets = uniqueAssets.filter(a => a.asset_type === 'GALLERY');
  const inscriptionAssets = uniqueAssets.filter(a => a.asset_type === 'INSCRIPTION');
  const otherAssets = uniqueAssets.filter(a => a.asset_type === 'OTHER');

  console.log(`Total assets found (including duplicates): ${allAssets.length}`);
  console.log(`Unique assets: ${uniqueAssets.length}`);
  console.log(`Gallery: ${galleryAssets.length}`);
  console.log(`Inscription: ${inscriptionAssets.length}`);
  console.log(`Other: ${otherAssets.length}`);

  const catalog = {
    generated_at: new Date().toISOString(),
    total_discovered: allAssets.length,
    unique_assets: uniqueAssets.length,
    gallery_assets: galleryAssets.length,
    inscription_assets: inscriptionAssets.length,
    other_assets: otherAssets.length,
    assets: uniqueAssets
  };

  fs.writeFileSync(path.join(ASSETS_DIR, 'asset_catalog.json'), JSON.stringify(catalog, null, 2));
  console.log(`\nCatalog saved: ${path.join(ASSETS_DIR, 'asset_catalog.json')}`);

  await mongoose.disconnect();
}

discoverAssets().catch(err => { console.error(err); process.exit(1); });
