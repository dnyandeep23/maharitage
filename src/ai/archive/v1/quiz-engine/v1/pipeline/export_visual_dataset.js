/**
 * Visual Training Data Exporter (Split By Site)
 * 
 * Exports visual annotations (image & inscription) into train/validation/test splits.
 * STRICT RULE: Split by SITE so images from the same site never appear in both train and test.
 * Text annotations MUST NOT enter these directories.
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const ANNOTATION_DIR = path.resolve(PROJECT_ROOT, 'src/ai/quiz-engine/data/annotations/visual');
const DATASET_DIR = path.resolve(PROJECT_ROOT, 'src/ai/quiz-engine/data/datasets/visual');

// Site allocation for strict site-isolated splits (10 sites)
const SITE_SPLITS = {
  train: ["Ell0001", "Kan0004", "Fort0001", "Fort0002", "Fort0003", "Pit0002"],
  validation: ["Aja0003", "Ele0005"],
  test: ["Fort0005", "Fort0004"]
};

export function exportVisualDataset(readinessDecision) {
  if (readinessDecision !== "YES") {
    console.log(`⚠️ Readiness decision is '${readinessDecision}'. Skipping dataset export.`);
    return { exported: false, reason: "VISUAL_TRAINING_READY is NOT YES" };
  }

  console.log(`\n════════════════════════════════════════════════`);
  console.log(`  EXPORTING VISUAL MODEL TRAINING DATASET`);
  console.log(`════════════════════════════════════════════════`);

  const DIRS = {
    root: DATASET_DIR,
    train: path.join(DATASET_DIR, 'train'),
    validation: path.join(DATASET_DIR, 'validation'),
    test: path.join(DATASET_DIR, 'test')
  };

  Object.values(DIRS).forEach(d => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });

  const loadVisualForSite = (siteId) => {
    const imgPath = path.join(ANNOTATION_DIR, 'image', `${siteId}.json`);
    const inscPath = path.join(ANNOTATION_DIR, 'inscription', `${siteId}.json`);

    const imgAnns = fs.existsSync(imgPath) ? JSON.parse(fs.readFileSync(imgPath, 'utf8')) : [];
    const inscAnns = fs.existsSync(inscPath) ? JSON.parse(fs.readFileSync(inscPath, 'utf8')) : [];

    return [...imgAnns, ...inscAnns];
  };

  const trainData = SITE_SPLITS.train.flatMap(loadVisualForSite);
  const valData = SITE_SPLITS.validation.flatMap(loadVisualForSite);
  const testData = SITE_SPLITS.test.flatMap(loadVisualForSite);

  // Safety check: Ensure no text questions exist in visual dataset
  const hasTextInVisual = [...trainData, ...valData, ...testData].some(a => a.question_type === "text");
  if (hasTextInVisual) {
    throw new Error("CRITICAL ERROR: Text annotations detected in visual training dataset!");
  }

  fs.writeFileSync(path.join(DIRS.train, 'train_dataset.json'), JSON.stringify(trainData, null, 2));
  fs.writeFileSync(path.join(DIRS.validation, 'validation_dataset.json'), JSON.stringify(valData, null, 2));
  fs.writeFileSync(path.join(DIRS.test, 'test_dataset.json'), JSON.stringify(testData, null, 2));

  console.log(`  Train Split (${SITE_SPLITS.train.length} sites): ${trainData.length} visual items -> data/datasets/visual/train/train_dataset.json`);
  console.log(`  Validation Split (${SITE_SPLITS.validation.length} sites): ${valData.length} visual items -> data/datasets/visual/validation/validation_dataset.json`);
  console.log(`  Test Split (${SITE_SPLITS.test.length} sites): ${testData.length} visual items -> data/datasets/visual/test/test_dataset.json`);
  console.log(`  Total Visual Training Items: ${trainData.length + valData.length + testData.length}`);
  console.log(`════════════════════════════════════════════════\n`);

  return {
    exported: true,
    splits: {
      train: trainData.length,
      validation: valData.length,
      test: testData.length,
      total: trainData.length + valData.length + testData.length
    }
  };
}
