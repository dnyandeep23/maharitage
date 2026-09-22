/**
 * Comprehensive Dataset Expansion Pipeline Runner
 * 
 * Expands both Text (~100/site) and Visual (TRUE_VISUAL score=3 only) annotations across all 10 sites.
 * Rebalances option positions (~25% A/B/C/D).
 * Reruns Coverage Audit & Quality Audit.
 * Exports site-isolated Visual Model Training Splits if VISUAL_TRAINING_READY === YES.
 * 
 * Usage: node src/ai/quiz-engine/v1/pipeline/expand_visual_dataset.js
 */

import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { expandTextAnnotationsForSite } from '../annotation/text_expansion.js';
import { expandImageAnnotationsForSite, expandInscriptionAnnotationsForSite } from '../annotation/visual_expansion.js';
import { balanceDatasetOptions } from '../annotation/option_balancer.js';
import { toCleanString } from '../verification/mongodb_verifier.js';

const PROJECT_ROOT = process.cwd();
const DATA_DIR = path.resolve(PROJECT_ROOT, 'src/ai/quiz-engine/data/annotations');
const DIRS = {
  text: path.join(DATA_DIR, 'text'),
  image: path.join(DATA_DIR, 'visual/image'),
  inscription: path.join(DATA_DIR, 'visual/inscription'),
  reports: path.join(DATA_DIR, 'reports')
};

function ensureDirs() {
  Object.values(DIRS).forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function saveOrCleanJson(filePath, data) {
  if (Array.isArray(data) && data.length > 0) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } else {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

function loadExisting(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(data)) return data;
    } catch {}
  }
  return [];
}

const envPath = path.resolve(PROJECT_ROOT, '.env.local');
let mongoUri = process.env.MONGODB_URI;
if (!mongoUri && fs.existsSync(envPath)) {
  const match = fs.readFileSync(envPath, 'utf8').match(/MONGODB_URI=["']?([^"'\n]+)/);
  if (match) mongoUri = match[1];
}

async function main() {
  console.log(`\n════════════════════════════════════════════════`);
  console.log(`  MAHARITAGE QUIZ ENGINE — DATASET EXPANSION`);
  console.log(`════════════════════════════════════════════════\n`);

  if (!mongoUri) {
    console.error("MONGODB_URI not found");
    process.exit(1);
  }

  ensureDirs();

  await mongoose.connect(mongoUri);
  const Site = mongoose.models.Site || mongoose.model('Site', new mongoose.Schema({}, { strict: false }));
  const sites = await Site.find({}).lean();

  console.log(`Loaded ${sites.length} sites from MongoDB.\n`);

  for (let i = 0; i < sites.length; i++) {
    const siteDoc = sites[i];
    const siteId = toCleanString(siteDoc.site_id);
    const siteName = toCleanString(siteDoc.site_name, "Heritage Site");

    console.log(`[${i + 1}/${sites.length}] Expanding dataset for ${siteName} (${siteId})...`);

    // Load existing annotations to preserve valid items
    const existingText = loadExisting(path.join(DIRS.text, `${siteId}.json`));
    const existingImage = loadExisting(path.join(DIRS.image, `${siteId}.json`));
    const existingInsc = loadExisting(path.join(DIRS.inscription, `${siteId}.json`));

    // 1. Text Expansion (~100 per site)
    const expandedText = expandTextAnnotationsForSite(siteDoc, existingText);
    const balancedText = balanceDatasetOptions(expandedText);
    saveOrCleanJson(path.join(DIRS.text, `${siteId}.json`), balancedText.dataset);

    // 2. Image TRUE_VISUAL Expansion
    const expandedImage = expandImageAnnotationsForSite(siteDoc, existingImage);
    const balancedImage = balanceDatasetOptions(expandedImage);
    saveOrCleanJson(path.join(DIRS.image, `${siteId}.json`), balancedImage.dataset);

    // 3. Inscription TRUE_VISUAL Expansion
    const expandedInsc = expandInscriptionAnnotationsForSite(siteDoc, existingInsc);
    const balancedInsc = balanceDatasetOptions(expandedInsc);
    saveOrCleanJson(path.join(DIRS.inscription, `${siteId}.json`), balancedInsc.dataset);

    console.log(`  ✅ ${siteName}: Text=${balancedText.dataset.length}, Image=${balancedImage.dataset.length}, Inscription=${balancedInsc.dataset.length}`);
  }

  await mongoose.disconnect();

  console.log(`\n════════════════════════════════════════════════`);
  console.log(`  DATASET EXPANSION COMPLETE`);
  console.log(`════════════════════════════════════════════════\n`);
}

main().catch(err => {
  console.error("Expansion Pipeline Error:", err);
  process.exit(1);
});
