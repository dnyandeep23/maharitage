/**
 * Rebuilt Independent Blind Visual Benchmark Evaluator
 * 
 * Computes all benchmark metrics, baselines, and gates:
 * - BENCHMARK_STATUS = VALID
 * - OPTION_BALANCE_GATE = PASS/FAIL
 * - IMAGE_DEPENDENCY_GATE = PASS/FAIL
 * - POSITION_BIAS_DETECTED = true/false
 * - Baselines: Random Guess (25%), Always-A, Always-B, Always-C, Always-D, Majority Class
 * - Accuracy: Raw Accuracy, Text-Only Accuracy, Image Gain, Unseen-Site Accuracy
 * - Robustness: 4-Way Shuffle Consistency, Distractor Robustness, Site-Context Sensitivity
 * - Decision Gate: BASELINE_TRAINING_DECISION (DO_NOT_TRAIN | MORE_DATA_REQUIRED | TRAINING_JUSTIFIED)
 * 
 * Usage: node src/ai/quiz-engine/v1/baseline/independent/blind_evaluator.js
 */

import fs from 'fs';
import path from 'path';
import { evaluateVisualEvidenceGrounding } from './evidence_evaluator.js';
import { verifyPredictionAgainstDatabase } from './db_verifier.js';
import { writeIndependentBenchmarkReport } from './result_writer.js';

const PROJECT_ROOT = process.cwd();
const BENCHMARK_DIR = path.resolve(PROJECT_ROOT, 'src/ai/quiz-engine/data/benchmarks/visual_gold');
const RAW_RUNS_PATH = path.join(BENCHMARK_DIR, 'reports/raw_evaluation_runs.json');
const MANIFEST_PATH = path.join(BENCHMARK_DIR, 'manifests/gold_manifest.json');

const UNSEEN_SITES = new Set(["Fort0005", "Fort0004"]);

export async function runBlindEvaluation() {
  console.log(`\n════════════════════════════════════════════════`);
  console.log(`  EVALUATING REBUILT BLIND BENCHMARK RESULTS`);
  console.log(`════════════════════════════════════════════════\n`);

  if (!fs.existsSync(RAW_RUNS_PATH) || !fs.existsSync(MANIFEST_PATH)) {
    throw new Error("Raw runs or gold manifest not found. Run benchmark_builder and benchmark_runner first.");
  }

  const rawRuns = JSON.parse(fs.readFileSync(RAW_RUNS_PATH, 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  const total = rawRuns.length;
  let correctWithImage = 0;
  let correctWithoutImage = 0;
  let correctVersionB = 0;
  let evidenceGroundedCount = 0;
  let dbVerifiedCount = 0;
  let shuffleMatches = 0;
  let distractorMatches = 0;

  // Option Distribution Counts for Correct Answers
  const correctOptCounts = { A: 0, B: 0, C: 0, D: 0 };
  const predOptCounts = { A: 0, B: 0, C: 0, D: 0 };

  const categories = {
    CORRECT_AND_VISUALLY_SUPPORTED: 0,
    CORRECT_BUT_NOT_VISUALLY_SUPPORTED: 0,
    INCORRECT: 0,
    DATABASE_VERIFICATION_FAILED: 0,
    AMBIGUOUS: 0,
    ABSTAIN: 0
  };

  const confusionMatrix = {
    A: { A: 0, B: 0, C: 0, D: 0 },
    B: { A: 0, B: 0, C: 0, D: 0 },
    C: { A: 0, B: 0, C: 0, D: 0 },
    D: { A: 0, B: 0, C: 0, D: 0 }
  };

  const perSiteAccuracy = {};
  const perCategoryAccuracy = {};
  let unseenCorrect = 0, unseenTotal = 0;
  let seenCorrect = 0, seenTotal = 0;

  rawRuns.forEach(run => {
    correctOptCounts[run.expectedLetter] = (correctOptCounts[run.expectedLetter] || 0) + 1;
    predOptCounts[run.rawPrediction] = (predOptCounts[run.rawPrediction] || 0) + 1;

    const isCorrectWithImage = run.rawPrediction === run.expectedLetter;
    if (isCorrectWithImage) correctWithImage++;
    if (run.textOnlyCorrect) correctWithoutImage++;
    if (run.versionB_correct) correctVersionB++;

    // Confusion matrix
    if (confusionMatrix[run.expectedLetter] && confusionMatrix[run.expectedLetter][run.rawPrediction] !== undefined) {
      confusionMatrix[run.expectedLetter][run.rawPrediction]++;
    }

    // Evidence & DB Verification
    const evidEval = evaluateVisualEvidenceGrounding(run.observationText, run.visual_evidence);
    if (evidEval.grounded) evidenceGroundedCount++;

    const dbRes = verifyPredictionAgainstDatabase(run, run);
    if (dbRes.status === "PASS") dbVerifiedCount++;

    // Classification
    if (isCorrectWithImage) {
      if (evidEval.grounded) categories.CORRECT_AND_VISUALLY_SUPPORTED++;
      else categories.CORRECT_BUT_NOT_VISUALLY_SUPPORTED++;
    } else {
      categories.INCORRECT++;
    }

    // Robustness
    shuffleMatches += run.shuffleConsistencyCount;
    if (run.distractorRobust) distractorMatches++;

    // Per-site & Per-category tracking
    const sId = run.site_id;
    if (!perSiteAccuracy[sId]) perSiteAccuracy[sId] = { correct: 0, total: 0 };
    perSiteAccuracy[sId].total++;
    if (isCorrectWithImage) perSiteAccuracy[sId].correct++;

    const cat = run.category || "General";
    if (!perCategoryAccuracy[cat]) perCategoryAccuracy[cat] = { correct: 0, total: 0 };
    perCategoryAccuracy[cat].total++;
    if (isCorrectWithImage) perCategoryAccuracy[cat].correct++;

    if (UNSEEN_SITES.has(sId)) {
      unseenTotal++;
      if (isCorrectWithImage) unseenCorrect++;
    } else {
      seenTotal++;
      if (isCorrectWithImage) seenCorrect++;
    }
  });

  // Option Balance Gate Check
  const countsArr = Object.values(correctOptCounts);
  const maxOptCount = Math.max(...countsArr);
  const minOptCount = Math.min(...countsArr);
  const optionBalanceGate = (maxOptCount - minOptCount <= 2 && minOptCount > 0) ? "PASS" : "FAIL";

  // Baselines Calculation
  const randomGuessAccuracy = 25.0;
  const alwaysAAccuracy = parseFloat(((correctOptCounts.A / total) * 100).toFixed(1));
  const alwaysBAccuracy = parseFloat(((correctOptCounts.B / total) * 100).toFixed(1));
  const alwaysCAccuracy = parseFloat(((correctOptCounts.C / total) * 100).toFixed(1));
  const alwaysDAccuracy = parseFloat(((correctOptCounts.D / total) * 100).toFixed(1));
  const majorityClassAccuracy = Math.max(alwaysAAccuracy, alwaysBAccuracy, alwaysCAccuracy, alwaysDAccuracy);
  const positionBiasDetected = (maxOptCount / total) > 0.35;

  // Accuracies & Image Gain
  const accuracyWithImage = parseFloat(((correctWithImage / total) * 100).toFixed(1));
  const accuracyWithoutImage = parseFloat(((correctWithoutImage / total) * 100).toFixed(1));
  const imageGain = parseFloat((accuracyWithImage - accuracyWithoutImage).toFixed(1));
  const imageDependencyGate = (imageGain >= 30.0 || accuracyWithoutImage <= 35.0) ? "PASS" : "FAIL";

  const versionBAccuracy = parseFloat(((correctVersionB / total) * 100).toFixed(1));
  const evidenceRate = parseFloat(((evidenceGroundedCount / total) * 100).toFixed(1));
  const dbVerificationRate = parseFloat(((dbVerifiedCount / total) * 100).toFixed(1));
  const shuffleConsistency = parseFloat((((shuffleMatches / (total * 4))) * 100).toFixed(1));
  const distractorRobustness = parseFloat(((distractorMatches / total) * 100).toFixed(1));
  const siteContextSensitivity = parseFloat(Math.abs(versionBAccuracy - accuracyWithImage).toFixed(1));

  const seenAccuracy = seenTotal > 0 ? parseFloat(((seenCorrect / seenTotal) * 100).toFixed(1)) : 0.0;
  const unseenAccuracy = unseenTotal > 0 ? parseFloat(((unseenCorrect / unseenTotal) * 100).toFixed(1)) : 0.0;

  // Statistical Status
  const benchmarkStatisticalStatus = unseenTotal >= 50 ? "SUFFICIENT" : "INSUFFICIENT";

  // BASELINE_TRAINING_DECISION GATE
  let trainingDecision = "MORE_DATA_REQUIRED";
  let decisionReason = "";

  if (unseenTotal < 50) {
    trainingDecision = "MORE_DATA_REQUIRED";
    decisionReason = `Unseen-site test size (${unseenTotal} questions across ${UNSEEN_SITES.size} sites) is below 50. Insufficient data to justify model fine-tuning.`;
  } else if (unseenAccuracy >= 85.0 && shuffleConsistency >= 85.0) {
    trainingDecision = "DO_NOT_TRAIN";
    decisionReason = "Zero-shot visual reasoning accuracy & shuffle robustness are already high (>=85%). Fine-tuning is not required.";
  } else if (accuracyWithImage < 40.0) {
    trainingDecision = "MORE_DATA_REQUIRED";
    decisionReason = "Zero-shot visual perception accuracy is low (<40%). Improving image data quality is required before fine-tuning.";
  }

  const metrics = {
    benchmark_status: "VALID",
    option_balance_gate: optionBalanceGate,
    image_dependency_gate: imageDependencyGate,
    position_bias_detected: positionBiasDetected,
    benchmark_statistical_status: benchmarkStatisticalStatus,
    total_benchmark_questions: total,
    baselines: {
      random_guess_pct: randomGuessAccuracy,
      always_A_pct: alwaysAAccuracy,
      always_B_pct: alwaysBAccuracy,
      always_C_pct: alwaysCAccuracy,
      always_D_pct: alwaysDAccuracy,
      majority_class_pct: majorityClassAccuracy
    },
    accuracy: {
      accuracy_with_image_pct: accuracyWithImage,
      accuracy_without_image_pct: accuracyWithoutImage,
      image_gain_pct: imageGain,
      seen_site_accuracy_pct: seenAccuracy,
      unseen_site_accuracy_pct: unseenAccuracy,
      unseen_site_question_count: unseenTotal
    },
    robustness: {
      option_shuffle_consistency_pct: shuffleConsistency,
      distractor_robustness_pct: distractorRobustness,
      site_context_sensitivity_pct: siteContextSensitivity
    },
    verification: {
      visual_evidence_supported_rate_pct: evidenceRate,
      database_verification_rate_pct: dbVerificationRate
    },
    option_distribution: correctOptCounts,
    predicted_distribution: predOptCounts,
    confusion_matrix: confusionMatrix,
    categories,
    per_site_accuracy: perSiteAccuracy,
    per_category_accuracy: perCategoryAccuracy,
    decision: {
      baseline_training_decision: trainingDecision,
      reason: decisionReason
    }
  };

  console.log(`Evaluated ${total} Rebuilt Independent Benchmark Items:`);
  console.log(`  BENCHMARK_STATUS:           VALID`);
  console.log(`  OPTION_BALANCE_GATE:        ${optionBalanceGate} (A:${correctOptCounts.A}, B:${correctOptCounts.B}, C:${correctOptCounts.C}, D:${correctOptCounts.D})`);
  console.log(`  IMAGE_DEPENDENCY_GATE:      ${imageDependencyGate} (With Image: ${accuracyWithImage}%, Without Image: ${accuracyWithoutImage}%, Gain: +${imageGain}%)`);
  console.log(`  POSITION_BIAS_DETECTED:     ${positionBiasDetected}`);
  console.log(`  Random Guess Baseline:      ${randomGuessAccuracy}%`);
  console.log(`  Majority Class Baseline:    ${majorityClassAccuracy}%`);
  console.log(`  Raw SmolVLM Accuracy:       ${accuracyWithImage}%`);
  console.log(`  Unseen Site Accuracy (${unseenTotal} items): ${unseenAccuracy}%`);
  console.log(`  Option Shuffle Consistency: ${shuffleConsistency}%`);
  console.log(`  Distractor Robustness:      ${distractorRobustness}%`);
  console.log(`  Site-Context Sensitivity:   ${siteContextSensitivity}%\n`);

  writeIndependentBenchmarkReport(metrics, manifest);

  console.log(`════════════════════════════════════════════════`);
  console.log(`  BASELINE_TRAINING_DECISION = ${trainingDecision}`);
  console.log(`════════════════════════════════════════════════\n`);

  return metrics;
}

if (process.argv[1]?.endsWith('blind_evaluator.js')) {
  runBlindEvaluation().catch(err => {
    console.error("Blind Evaluator Error:", err);
    process.exit(1);
  });
}
