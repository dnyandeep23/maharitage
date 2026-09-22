/**
 * Rebuilt Generic Site Processor (Visual Grounding Architecture)
 * 
 * Orchestrates:
 * 1. Text annotations (Preserved from validated ground truth)
 * 2. Image TRUE_VISUAL annotations (score=3 only)
 * 3. Inscription TRUE_VISUAL annotations (score=3 only)
 * 4. 20-point validation with Visual Dependency Gate
 * 5. Multi-stage semantic deduplication
 * 6. Option position balancing (~25% A/B/C/D)
 * 7. Empty file prevention (never creates [] JSON files)
 * 
 * ZERO site-specific logic. Works for caves, forts, and any heritage site.
 */

import fs from 'fs';
import path from 'path';
import { generateTextAnnotations } from '../annotation/text_generator.js';
import { generateImageAnnotations } from '../annotation/image_generator.js';
import { generateInscriptionAnnotations } from '../annotation/inscription_generator.js';
import { validateAnnotation } from '../annotation/validator.js';
import { deduplicateQuestions } from '../annotation/duplicate_detector.js';
import { balanceDatasetOptions } from '../annotation/option_balancer.js';
import { toCleanString } from '../verification/mongodb_verifier.js';

const DATA_DIR = path.resolve(process.cwd(), 'src/ai/quiz-engine/data/annotations');
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
    // If empty, remove file if it exists to avoid empty [] files
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

/**
 * Process a single site document through the complete visual pipeline.
 */
export function processSite(siteDoc) {
  if (!siteDoc || !siteDoc.site_id) {
    throw new Error("Invalid site document: missing site_id");
  }

  ensureDirs();

  const siteId = toCleanString(siteDoc.site_id);
  const siteName = toCleanString(siteDoc.site_name, "Heritage Site");

  console.log(`\n━━━ Processing: ${siteName} (${siteId}) ━━━`);

  // 1. Text Annotations: Load existing preserved file if present, else generate
  let textDataset = [];
  const textFilePath = path.join(DIRS.text, `${siteId}.json`);
  if (fs.existsSync(textFilePath)) {
    try {
      textDataset = JSON.parse(fs.readFileSync(textFilePath, 'utf8'));
      console.log(`  [1/6] Preserving ${textDataset.length} ground-truth text annotations`);
    } catch {
      const textResult = generateTextAnnotations(siteDoc);
      textDataset = textResult.annotations;
    }
  } else {
    const textResult = generateTextAnnotations(siteDoc);
    textDataset = textResult.annotations;
  }

  // 2. Generate Image & Inscription Candidates (TRUE_VISUAL score=3 only)
  console.log(`  [2/6] Generating TRUE_VISUAL image annotations...`);
  const imageResult = generateImageAnnotations(siteDoc);

  console.log(`  [3/6] Generating TRUE_VISUAL inscription annotations...`);
  const inscriptionResult = generateInscriptionAnnotations(siteDoc);

  // 3. Validation
  console.log(`  [4/6] Validating annotations against Visual Dependency Gate...`);
  const validateAndFilter = (annotations) => {
    const valid = [];
    const invalid = [];
    for (const ann of annotations) {
      const result = validateAnnotation(ann);
      if (result.valid) {
        valid.push(ann);
      } else {
        invalid.push({ annotation_id: ann.annotation_id, errors: result.errors });
      }
    }
    return { valid, invalid };
  };

  const imageValidation = validateAndFilter(imageResult.annotations);
  const inscriptionValidation = validateAndFilter(inscriptionResult.annotations);

  // 4. Deduplicate
  console.log(`  [5/6] Deduplicating semantic duplicates...`);
  const imageDedup = deduplicateQuestions(imageValidation.valid);
  const inscriptionDedup = deduplicateQuestions(inscriptionValidation.valid);

  // 5. Balance options
  console.log(`  [6/6] Balancing option positions (~25% A/B/C/D)...`);
  const textBalanced = balanceDatasetOptions(textDataset);
  const imageBalanced = balanceDatasetOptions(imageDedup.unique);
  const inscriptionBalanced = balanceDatasetOptions(inscriptionDedup.unique);

  // 6. Save JSON files (Clean empty files)
  saveOrCleanJson(path.join(DIRS.text, `${siteId}.json`), textBalanced.dataset);
  saveOrCleanJson(path.join(DIRS.image, `${siteId}.json`), imageBalanced.dataset);
  saveOrCleanJson(path.join(DIRS.inscription, `${siteId}.json`), inscriptionBalanced.dataset);

  const report = {
    site_id: siteId,
    site_name: siteName,
    heritage_type: toCleanString(siteDoc.heritage_type),
    text: {
      final_count: textBalanced.dataset.length,
      option_distribution: textBalanced.counts
    },
    image: {
      images_processed: imageResult.images_processed,
      generated: imageResult.raw_candidates,
      accepted_score_3: imageResult.accepted_count,
      rejected_db_only: imageResult.rejected_count,
      validated: imageValidation.valid.length,
      duplicates_removed: imageDedup.duplicates.length,
      final_count: imageBalanced.dataset.length,
      option_distribution: imageBalanced.counts
    },
    inscription: {
      inscriptions_processed: inscriptionResult.inscriptions_processed,
      generated: inscriptionResult.raw_candidates,
      accepted_score_3: inscriptionResult.accepted_count,
      rejected_db_only: inscriptionResult.rejected_count,
      validated: inscriptionValidation.valid.length,
      duplicates_removed: inscriptionDedup.duplicates.length,
      final_count: inscriptionBalanced.dataset.length,
      option_distribution: inscriptionBalanced.counts
    },
    totals: {
      total_final: textBalanced.dataset.length + imageBalanced.dataset.length + inscriptionBalanced.dataset.length,
      total_visual_final: imageBalanced.dataset.length + inscriptionBalanced.dataset.length
    }
  };

  console.log(`  ✅ ${siteName}: ${report.totals.total_final} total annotations saved (Text: ${report.text.final_count}, TRUE_VISUAL Image: ${report.image.final_count}, TRUE_VISUAL Inscription: ${report.inscription.final_count})`);

  return report;
}
