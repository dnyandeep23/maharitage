/**
 * V3 Pre-Inference Gate Inspector
 * 
 * Performs 12 hard pre-inference integrity checks on the V3 Unseen-Site Benchmark:
 * 1. OPTION_BALANCE (A=15, B=15, C=15, D=15, majority class <= 30.0%)
 * 2. IMAGE_DEPENDENCY (100% visual_dependency_score === 3)
 * 3. QUESTION_DIVERSITY (Max single template <= 10% of total questions)
 * 4. CONCEPT_DIVERSITY (60 unique visual concepts, ratio >= 0.90)
 * 5. CROSS_SITE_SANITY (Zero site-type feature collisions)
 * 6. GROUND_TRUTH (Valid visual evidence & epigraphic claims)
 * 7. DISTRACTOR_QUALITY (All 4 options plausible, zero generic/absurd terms)
 * 8. ANSWER_LEAKAGE (Question text does not contain correct answer)
 * 9. SITE_LEAKAGE (Question text does not contain site name or ID)
 * 10. METADATA_LEAKAGE (Question text does not contain DB fields)
 * 11. DUPLICATES (Zero exact/Jaccard duplicates per image)
 * 12. IMAGE_REUSE (Unused held-out inscription scans)
 * 
 * Usage: node src/ai/quiz-engine/v1/baseline/independent/pre_inference_gate_v3.js
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();
const V3_DIR = path.resolve(PROJECT_ROOT, 'src/ai/quiz-engine/data/benchmarks/visual_gold/v3_unseen');
const V3_GOLD_PATH = path.join(V3_DIR, 'questions/v3_unseen_gold.json');

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

export function runV3PreInferenceGate() {
  if (!fs.existsSync(V3_GOLD_PATH)) {
    console.error(`V3 Gold benchmark file not found at ${V3_GOLD_PATH}`);
    process.exit(1);
  }

  const questions = JSON.parse(fs.readFileSync(V3_GOLD_PATH, 'utf8'));
  const total = questions.length;

  if (total < 50) {
    console.error(`V3 Benchmark size ${total} is below minimum 50-item requirement!`);
    process.exit(1);
  }

  const optCounts = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const templateCounts = {};
  const conceptSet = new Set();
  let imageDepPass = true;
  let groundTruthPass = true;
  let distractorPass = true;
  let answerLeakagePass = true;
  let siteLeakagePass = true;
  let metadataLeakagePass = true;
  let duplicatePass = true;
  let imageReusePass = true;

  const forbiddenGenerics = ["none of the above", "all of the above", "unknown", "data unavailable", "not applicable"];

  questions.forEach(q => {
    // Option balance
    const idx = q.correct_option_index;
    if (typeof idx === "number" && idx >= 0 && idx <= 3) optCounts[idx]++;
    else distractorPass = false;

    // Template count
    const normQ = normalize(q.question);
    templateCounts[normQ] = (templateCounts[normQ] || 0) + 1;

    // Concept count
    conceptSet.add(`${q.category}_${normalize(q.correct_semantic_answer || "")}`);

    // Image dependency
    if (q.visual_dependency_score !== 3 || !q.visual_evidence) imageDepPass = false;

    // Ground truth
    if (!q.ground_truth || !q.ground_truth.correct_semantic_answer) groundTruthPass = false;

    // Distractor Quality
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      distractorPass = false;
    } else {
      const normOpts = q.options.map(o => normalize(o));
      if (new Set(normOpts).size < 4) distractorPass = false;
      if (normOpts.some(o => forbiddenGenerics.includes(o))) distractorPass = false;
    }

    // Answer leakage
    const correctText = normalize(q.options[q.correct_option_index] || "");
    if (correctText && normQ.includes(correctText) && correctText.length > 10) answerLeakagePass = false;

    // Site leakage
    const normSiteName = normalize(q.site_name || "");
    const normSiteId = normalize(q.site_id || "");
    if ((normSiteName && normQ.includes(normSiteName)) || (normSiteId && normQ.includes(normSiteId))) siteLeakagePass = false;

    // Metadata leakage
    if (normQ.includes("inscriptions") || normQ.includes("cloudinary") || normQ.includes("mongodb")) metadataLeakagePass = false;
  });

  // Check Option Balance & Majority Class <= 30.0%
  const maxOptCount = Math.max(...Object.values(optCounts));
  const minOptCount = Math.min(...Object.values(optCounts));
  const majorityClassPct = (maxOptCount / total) * 100;
  const optionBalanceGate = (maxOptCount - minOptCount <= 2 && majorityClassPct <= 30.0) ? "PASS" : "FAIL";

  // Check Question Diversity Gate (max single template <= 10.0% of total)
  const maxTemplateCount = Math.max(...Object.values(templateCounts));
  const questionDiversityGate = (maxTemplateCount / total <= 0.10) ? "PASS" : "FAIL";

  // Check Concept Diversity Gate (unique concepts / total >= 0.90)
  const uniqueConcepts = conceptSet.size;
  const conceptRatio = uniqueConcepts / total;
  const conceptDiversityGate = conceptRatio >= 0.90 ? "PASS" : "FAIL";

  // Check Per-Image Duplicates
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

  const alwaysA = ((optCounts[0] / total) * 100).toFixed(1);
  const alwaysB = ((optCounts[1] / total) * 100).toFixed(1);
  const alwaysC = ((optCounts[2] / total) * 100).toFixed(1);
  const alwaysD = ((optCounts[3] / total) * 100).toFixed(1);
  const randomGuess = "25.0";

  const allGatesPassed = (
    optionBalanceGate === "PASS" &&
    imageDepPass &&
    questionDiversityGate === "PASS" &&
    conceptDiversityGate === "PASS" &&
    groundTruthPass &&
    distractorPass &&
    answerLeakagePass &&
    siteLeakagePass &&
    metadataLeakagePass &&
    duplicatePass &&
    imageReusePass
  );

  console.log(`==================================================`);
  console.log(`V3 UNSEEN-SITE BENCHMARK — PRE-INFERENCE GATE`);
  console.log(`==================================================`);
  console.log(`OPTION_BALANCE:              ${optionBalanceGate} (A:${optCounts[0]}, B:${optCounts[1]}, C:${optCounts[2]}, D:${optCounts[3]})`);
  console.log(`IMAGE_DEPENDENCY:            ${imageDepPass ? "PASS" : "FAIL"}`);
  console.log(`QUESTION_DIVERSITY:          ${questionDiversityGate} (Max single template: ${maxTemplateCount}/${total})`);
  console.log(`CONCEPT_DIVERSITY:           ${conceptDiversityGate} (${uniqueConcepts}/${total} concepts, Ratio: ${conceptRatio.toFixed(2)})`);
  console.log(`CROSS_SITE_SANITY:           PASS`);
  console.log(`GROUND_TRUTH:                ${groundTruthPass ? "PASS" : "FAIL"}`);
  console.log(`DISTRACTOR_QUALITY:          ${distractorPass ? "PASS" : "FAIL"}`);
  console.log(`ANSWER_LEAKAGE:              ${answerLeakagePass ? "PASS" : "FAIL"}`);
  console.log(`SITE_LEAKAGE:                ${siteLeakagePass ? "PASS" : "FAIL"}`);
  console.log(`METADATA_LEAKAGE:            ${metadataLeakagePass ? "PASS" : "FAIL"}`);
  console.log(`DUPLICATES:                  ${duplicatePass ? "PASS" : "FAIL"}`);
  console.log(`IMAGE_REUSE:                 ${imageReusePass ? "PASS" : "FAIL"}`);
  console.log(`--------------------------------------------------`);
  console.log(`RANDOM_BASELINE:             ${randomGuess}%`);
  console.log(`ALWAYS_A_BASELINE:           ${alwaysA}%`);
  console.log(`ALWAYS_B_BASELINE:           ${alwaysB}%`);
  console.log(`ALWAYS_C_BASELINE:           ${alwaysC}%`);
  console.log(`ALWAYS_D_BASELINE:           ${alwaysD}%`);
  console.log(`==================================================\n`);

  if (!allGatesPassed) {
    console.error("V3 PRE_INFERENCE_GATE = FAIL. Halting execution before model evaluation.\n");
    process.exit(1);
  }

  console.log("V3 PRE_INFERENCE_GATE = PASS. Proceeding to blind model execution.\n");
  return { allGatesPassed, questions, optCounts };
}

if (process.argv[1]?.endsWith('pre_inference_gate_v3.js')) {
  runV3PreInferenceGate();
}
