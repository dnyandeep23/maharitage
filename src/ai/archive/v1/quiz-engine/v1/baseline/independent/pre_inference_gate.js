/**
 * Pre-Inference Gate Inspector
 * 
 * Performs 10 hard pre-inference integrity checks on the independent benchmark.
 * MUST output PASS for all gates before benchmark_runner.js can execute.
 * 
 * Usage: node src/ai/quiz-engine/v1/baseline/independent/pre_inference_gate.js
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const BENCHMARK_DIR = path.resolve(PROJECT_ROOT, 'src/ai/quiz-engine/data/benchmarks/visual_gold');
const GOLD_PATH = path.join(BENCHMARK_DIR, 'questions/independent_visual_gold.json');

function normalize(text) {
  if (!text || typeof text !== "string") return "";
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function jaccardSimilarity(a, b) {
  const setA = new Set(normalize(a).split(" ").filter(Boolean));
  const setB = new Set(normalize(b).split(" ").filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export function runPreInferenceGate() {
  if (!fs.existsSync(GOLD_PATH)) {
    console.error(`Gold benchmark file not found at ${GOLD_PATH}`);
    process.exit(1);
  }

  const questions = JSON.parse(fs.readFileSync(GOLD_PATH, 'utf8'));
  const total = questions.length;

  if (total === 0) {
    console.error("Benchmark contains 0 questions!");
    process.exit(1);
  }

  // 1. OPTION BALANCE
  const optCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const catCounts = {};
  const templateCounts = {};
  let imageDepPass = true;
  let groundTruthPass = true;
  let distractorPass = true;
  let answerLeakagePass = true;
  let siteLeakagePass = true;
  let metadataLeakagePass = true;
  let duplicatePass = true;

  const forbiddenGenerics = ["none of the above", "all of the above", "unknown", "data unavailable", "not applicable"];

  questions.forEach(q => {
    // Option balance count
    const idx = q.correct_option_index;
    if (typeof idx === "number" && idx >= 0 && idx <= 3) optCounts[idx]++;
    else distractorPass = false;

    // Category count
    const cat = q.category || "General";
    catCounts[cat] = (catCounts[cat] || 0) + 1;

    // Template count (normalized text)
    const normQ = normalize(q.question);
    templateCounts[normQ] = (templateCounts[normQ] || 0) + 1;

    // Image dependency
    if (q.visual_dependency_score !== 3 || !q.visual_evidence) {
      imageDepPass = false;
    }

    // Ground truth
    if (!q.ground_truth || !q.ground_truth.correct_semantic_answer) {
      groundTruthPass = false;
    }

    // Distractor Quality
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      distractorPass = false;
    } else {
      const normOpts = q.options.map(o => normalize(o));
      if (new Set(normOpts).size < 4) distractorPass = false;
      if (normOpts.some(o => forbiddenGenerics.includes(o))) distractorPass = false;
    }

    // Answer Leakage (Question text containing exact correct option text)
    const correctText = normalize(q.options[q.correct_option_index] || "");
    if (correctText && normQ.includes(correctText) && correctText.length > 10) {
      answerLeakagePass = false;
    }

    // Site Leakage (Question text containing site name, site ID, or public ID)
    const normSiteName = normalize(q.site_name || "");
    const normSiteId = normalize(q.site_id || "");
    const normPublicId = normalize(q.cloudinary_public_id || "");
    if ((normSiteName && normQ.includes(normSiteName)) || (normSiteId && normQ.includes(normSiteId)) || (normPublicId && normQ.includes(normPublicId))) {
      siteLeakagePass = false;
    }

    // Metadata Leakage (Question text containing DB field name)
    if (normQ.includes("gallary") || normQ.includes("cloudinary") || normQ.includes("mongodb")) {
      metadataLeakagePass = false;
    }
  });

  // Check Option Balance Gate
  const optArr = Object.values(optCounts);
  const maxOpt = Math.max(...optArr);
  const minOpt = Math.min(...optArr);
  const optionBalanceGate = (maxOpt - minOpt <= 2 && minOpt > 0) ? "PASS" : "FAIL";

  // Check Question Diversity Gate (max single template <= 20% of total)
  const maxTemplateCount = Math.max(...Object.values(templateCounts));
  const questionDiversityGate = (maxTemplateCount / total <= 0.20) ? "PASS" : "FAIL";

  // Check Category Diversity Gate (max single category <= 40% of total)
  const maxCatCount = Math.max(...Object.values(catCounts));
  const categoryDiversityGate = (maxCatCount / total <= 0.40) ? "PASS" : "FAIL";

  // Check Duplicates Gate (per image duplicate check)
  const perImageQuestions = {};
  questions.forEach(q => {
    const key = q.image_url || q.cloudinary_public_id;
    if (!perImageQuestions[key]) perImageQuestions[key] = [];
    perImageQuestions[key].push(q);
  });

  for (const imgKey of Object.keys(perImageQuestions)) {
    const imgQs = perImageQuestions[imgKey];
    for (let i = 0; i < imgQs.length; i++) {
      for (let j = i + 1; j < imgQs.length; j++) {
        if (normalize(imgQs[i].question) === normalize(imgQs[j].question)) duplicatePass = false;
        else if (jaccardSimilarity(imgQs[i].question, imgQs[j].question) > 0.75) duplicatePass = false;
      }
    }
  }

  // Baseline Accuracies
  const alwaysA = ((optCounts[0] / total) * 100).toFixed(1);
  const alwaysB = ((optCounts[1] / total) * 100).toFixed(1);
  const alwaysC = ((optCounts[2] / total) * 100).toFixed(1);
  const alwaysD = ((optCounts[3] / total) * 100).toFixed(1);
  const randomGuess = "25.0";

  const allGatesPassed = (
    optionBalanceGate === "PASS" &&
    imageDepPass &&
    questionDiversityGate === "PASS" &&
    categoryDiversityGate === "PASS" &&
    groundTruthPass &&
    distractorPass &&
    answerLeakagePass &&
    siteLeakagePass &&
    metadataLeakagePass &&
    duplicatePass
  );

  console.log(`==================================================`);
  console.log(`INDEPENDENT VISUAL GOLD — PRE-INFERENCE GATE`);
  console.log(`==================================================`);
  console.log(`OPTION_BALANCE:              ${optionBalanceGate} (A:${optCounts[0]}, B:${optCounts[1]}, C:${optCounts[2]}, D:${optCounts[3]})`);
  console.log(`IMAGE_DEPENDENCY:            ${imageDepPass ? "PASS" : "FAIL"}`);
  console.log(`QUESTION_DIVERSITY:          ${questionDiversityGate} (Max single template: ${maxTemplateCount}/${total})`);
  console.log(`CATEGORY_DIVERSITY:          ${categoryDiversityGate} (Max single category: ${maxCatCount}/${total})`);
  console.log(`GROUND_TRUTH:                ${groundTruthPass ? "PASS" : "FAIL"}`);
  console.log(`DISTRACTOR_QUALITY:          ${distractorPass ? "PASS" : "FAIL"}`);
  console.log(`ANSWER_LEAKAGE:              ${answerLeakagePass ? "PASS" : "FAIL"}`);
  console.log(`SITE_LEAKAGE:                ${siteLeakagePass ? "PASS" : "FAIL"}`);
  console.log(`METADATA_LEAKAGE:            ${metadataLeakagePass ? "PASS" : "FAIL"}`);
  console.log(`DUPLICATES:                  ${duplicatePass ? "PASS" : "FAIL"}`);
  console.log(`--------------------------------------------------`);
  console.log(`RANDOM_BASELINE:             ${randomGuess}%`);
  console.log(`ALWAYS_A_BASELINE:           ${alwaysA}%`);
  console.log(`ALWAYS_B_BASELINE:           ${alwaysB}%`);
  console.log(`ALWAYS_C_BASELINE:           ${alwaysC}%`);
  console.log(`ALWAYS_D_BASELINE:           ${alwaysD}%`);
  console.log(`==================================================\n`);

  if (!allGatesPassed) {
    console.error("PRE_INFERENCE_GATE = FAIL. Halting execution before model evaluation.\n");
    process.exit(1);
  }

  console.log("PRE_INFERENCE_GATE = PASS. Proceeding to blind model execution.\n");
  return { allGatesPassed, questions, optCounts };
}

if (process.argv[1]?.endsWith('pre_inference_gate.js')) {
  runPreInferenceGate();
}
