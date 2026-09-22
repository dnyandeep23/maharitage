/**
 * V4 Expanded Benchmark Builder
 * Builds a strictly visually-dependent benchmark across 55 gallery items * 2 concepts = 110 items.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { buildV4ExpandedCatalogItems } from './v4_expanded_catalog.js';

const V4_EXPANDED_DIR = path.resolve('src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning_expanded');
const QUESTIONS_DIR = path.join(V4_EXPANDED_DIR, 'questions');
const MANIFESTS_DIR = path.join(V4_EXPANDED_DIR, 'manifests');
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

function buildV4ExpandedBenchmark() {
  console.log("\n════════════════════════════════════════════════");
  console.log("  BUILDING V4 EXPANDED GALLERY BENCHMARK");
  console.log("════════════════════════════════════════════════\n");

  if (!fs.existsSync(EXPORTED_ITEMS_PATH)) {
    console.error("Error: v4_gallery_items.json not found.");
    process.exit(1);
  }

  const items = JSON.parse(fs.readFileSync(EXPORTED_ITEMS_PATH, 'utf8'));

  let generatedQuestions = [];
  const correctOptionIndices = [];

  items.forEach((item, index) => {
    const seqNum = index + 1;
    const qs = buildV4ExpandedCatalogItems(item, seqNum);
    generatedQuestions.push(qs[0]);
    generatedQuestions.push(qs[1]);
  });

  // Shuffle correctly to balance
  generatedQuestions.forEach((q, i) => {
    correctOptionIndices.push(q.correct_option_index);
  });

  const dist = getDistribution(correctOptionIndices);

  const outputPath = path.join(QUESTIONS_DIR, 'v4_gallery_expanded_gold.json');
  fs.writeFileSync(outputPath, JSON.stringify(generatedQuestions, null, 2));

  const manifest = {
    benchmark_id: "v4_gallery_reasoning_expanded",
    generated_at: new Date().toISOString(),
    total_questions: generatedQuestions.length,
    option_distribution: dist,
    schema_version: "4.1.0",
    description: "Expanded strictly visually-dependent gallery benchmark (110 items)"
  };

  const manifestPath = path.join(MANIFESTS_DIR, 'v4_gallery_expanded_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("V4 Expanded Benchmark Saved Successfully:");
  console.log(`  Questions: ${generatedQuestions.length} items`);
  console.log(`  Distribution: A:${dist.A}, B:${dist.B}, C:${dist.C}, D:${dist.D}`);
  console.log("════════════════════════════════════════════════\n");
}

buildV4ExpandedBenchmark();
