/**
 * V4 Benchmark Builder: Gallery Image Visual Reasoning
 * Builds a strictly visually-dependent benchmark across 55 gallery items.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { buildV4CatalogItem } from './v4_gallery_catalog.js';

const V4_DIR = path.resolve('src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning');
const QUESTIONS_DIR = path.join(V4_DIR, 'questions');
const MANIFESTS_DIR = path.join(V4_DIR, 'manifests');
const EXPORTED_ITEMS_PATH = path.resolve('src/ai/quiz-engine/v1/baseline/independent/v4_gallery_items.json');

fs.mkdirSync(QUESTIONS_DIR, { recursive: true });
fs.mkdirSync(MANIFESTS_DIR, { recursive: true });

function getDistribution(options) {
  let A = 0, B = 0, C = 0, D = 0;
  options.forEach(idx => {
    if (idx === 0) A++;
    if (idx === 1) B++;
    if (idx === 2) C++;
    if (idx === 3) D++;
  });
  return { A, B, C, D };
}

function buildV4Benchmark() {
  console.log("\n════════════════════════════════════════════════");
  console.log("  BUILDING V4 GALLERY REASONING BENCHMARK (55 Items)");
  console.log("════════════════════════════════════════════════\n");

  if (!fs.existsSync(EXPORTED_ITEMS_PATH)) {
    console.error("Error: v4_gallery_items.json not found. Run export step first.");
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(EXPORTED_ITEMS_PATH, 'utf8'));

  const generatedQuestions = [];
  const correctOptionIndices = [];
  
  // Option assignment pattern ensuring max difference <= 2
  // We have 55 items: 14 A's, 14 B's, 14 C's, 13 D's (total 55)
  const optionCycle = [
    0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 
    0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 
    0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 
    0, 1, 2, 3, 0, 1, 2
  ];

  items.forEach((item, index) => {
    const seqNum = index + 1;
    const targetOption = optionCycle[index];
    correctOptionIndices.push(targetOption);
    
    const questionDoc = buildV4CatalogItem(item, seqNum, targetOption);
    generatedQuestions.push(questionDoc);
  });

  const dist = getDistribution(correctOptionIndices);

  const outputPath = path.join(QUESTIONS_DIR, 'v4_gallery_gold.json');
  fs.writeFileSync(outputPath, JSON.stringify(generatedQuestions, null, 2));

  const manifest = {
    benchmark_id: "v4_gallery_reasoning",
    generated_at: new Date().toISOString(),
    total_questions: generatedQuestions.length,
    option_distribution: dist,
    schema_version: "4.0.0",
    description: "Strictly visually-dependent gallery benchmark for true image reasoning"
  };

  const manifestPath = path.join(MANIFESTS_DIR, 'v4_gallery_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("V4 Benchmark Saved Successfully:");
  console.log(`  Questions Saved: src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/questions/v4_gallery_gold.json (${generatedQuestions.length} items)`);
  console.log(`  Manifest Saved:  src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/manifests/v4_gallery_manifest.json`);
  console.log(`  Option Distribution: A:${dist.A}, B:${dist.B}, C:${dist.C}, D:${dist.D}`);
  console.log("════════════════════════════════════════════════\n");
}

buildV4Benchmark();
