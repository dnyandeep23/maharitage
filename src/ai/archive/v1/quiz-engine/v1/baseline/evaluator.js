/**
 * Zero-Shot Visual Baseline Evaluator
 * 
 * Evaluates predictions across:
 * - Direct MCQ (Mode A)
 * - Visual Reasoning (Mode B)
 * - Evidence-Grounded Answer (Mode C)
 * - Option Shuffle Consistency
 * - Distractor Robustness
 * - Database Verification Layer
 * 
 * Categorizes every prediction into:
 * - CORRECT_AND_VISUALLY_SUPPORTED
 * - CORRECT_BUT_NOT_VISUALLY_SUPPORTED
 * - INCORRECT
 * - DATABASE_VERIFICATION_FAILED
 * - AMBIGUOUS
 * - ABSTAIN
 */

function normalize(text) {
  if (!text || typeof text !== "string") return "";
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Extract option letter (A, B, C, or D) from raw model output text.
 */
export function extractOptionLetter(rawText) {
  if (!rawText || typeof rawText !== "string") return "ABSTAIN";
  const clean = rawText.trim().toUpperCase();

  // 1. Direct single letter match
  if (["A", "B", "C", "D"].includes(clean)) return clean;

  // 2. Format: "Option: A" or "Option A"
  const optMatch = clean.match(/OPTION[:\s]+([A-D])\b/i);
  if (optMatch) return optMatch[1].toUpperCase();

  // 3. Choice at start of response: "A)" or "A."
  const startMatch = clean.match(/^([A-D])[\)\.\:\s]/);
  if (startMatch) return startMatch[1].toUpperCase();

  // 4. Regex search for standalone letter
  const letterMatch = clean.match(/\b([A-D])\b/);
  if (letterMatch) return letterMatch[1].toUpperCase();

  return "AMBIGUOUS";
}

/**
 * Classify a prediction against ground-truth answer and visual evidence.
 */
export function classifyPrediction({
  predictedLetter,
  expectedLetter,
  rawObservation,
  visualEvidence,
  dbVerified
}) {
  if (predictedLetter === "ABSTAIN") return "ABSTAIN";
  if (predictedLetter === "AMBIGUOUS") return "AMBIGUOUS";

  const isCorrect = predictedLetter === expectedLetter;

  if (!dbVerified) return "DATABASE_VERIFICATION_FAILED";

  if (isCorrect) {
    const normObs = normalize(rawObservation);
    const normEvid = normalize(visualEvidence);

    // Check if visual observation contains evidence keywords
    const keywords = normEvid.split(" ").filter(w => w.length > 3);
    const keywordMatches = keywords.filter(kw => normObs.includes(kw));

    if (keywordMatches.length >= 1 || normObs.length > 20) {
      return "CORRECT_AND_VISUALLY_SUPPORTED";
    }
    return "CORRECT_BUT_NOT_VISUALLY_SUPPORTED";
  }

  return "INCORRECT";
}

/**
 * Build 4x4 Confusion Matrix (Actual A..D vs Predicted A..D).
 */
export function buildConfusionMatrix(evaluations) {
  const labels = ["A", "B", "C", "D"];
  const matrix = {
    A: { A: 0, B: 0, C: 0, D: 0, AMBIGUOUS: 0, ABSTAIN: 0 },
    B: { A: 0, B: 0, C: 0, D: 0, AMBIGUOUS: 0, ABSTAIN: 0 },
    C: { A: 0, B: 0, C: 0, D: 0, AMBIGUOUS: 0, ABSTAIN: 0 },
    D: { A: 0, B: 0, C: 0, D: 0, AMBIGUOUS: 0, ABSTAIN: 0 }
  };

  evaluations.forEach(ev => {
    const actual = ev.expectedLetter;
    const pred = ev.predictedLetter;
    if (matrix[actual] && matrix[actual][pred] !== undefined) {
      matrix[actual][pred]++;
    }
  });

  return matrix;
}

/**
 * Calculate comprehensive summary metrics.
 */
export function calculateSummaryMetrics(evaluations, datasetSplits) {
  const total = evaluations.length;
  if (total === 0) return {};

  const categories = {
    CORRECT_AND_VISUALLY_SUPPORTED: 0,
    CORRECT_BUT_NOT_VISUALLY_SUPPORTED: 0,
    INCORRECT: 0,
    DATABASE_VERIFICATION_FAILED: 0,
    AMBIGUOUS: 0,
    ABSTAIN: 0
  };

  const optionDistribution = { A: 0, B: 0, C: 0, D: 0, AMBIGUOUS: 0, ABSTAIN: 0 };
  let correctCount = 0;
  let galleryCorrect = 0, galleryTotal = 0;
  let inscCorrect = 0, inscTotal = 0;

  // Split-level accuracy
  const splitStats = {
    train: { correct: 0, total: 0 },
    validation: { correct: 0, total: 0 },
    test: { correct: 0, total: 0 }
  };

  evaluations.forEach(ev => {
    categories[ev.classification] = (categories[ev.classification] || 0) + 1;
    optionDistribution[ev.predictedLetter] = (optionDistribution[ev.predictedLetter] || 0) + 1;

    const isCorrect = ev.predictedLetter === ev.expectedLetter;
    if (isCorrect) correctCount++;

    if (ev.question_type === "image") {
      galleryTotal++;
      if (isCorrect) galleryCorrect++;
    } else if (ev.question_type === "inscription") {
      inscTotal++;
      if (isCorrect) inscCorrect++;
    }

    const split = datasetSplits[ev.site_id] || "train";
    if (splitStats[split]) {
      splitStats[split].total++;
      if (isCorrect) splitStats[split].correct++;
    }
  });

  const overallAccuracy = ((correctCount / total) * 100).toFixed(1);
  const galleryAccuracy = galleryTotal > 0 ? ((galleryCorrect / galleryTotal) * 100).toFixed(1) : "0.0";
  const inscAccuracy = inscTotal > 0 ? ((inscCorrect / inscTotal) * 100).toFixed(1) : "0.0";

  const trainAccuracy = splitStats.train.total > 0 ? ((splitStats.train.correct / splitStats.train.total) * 100).toFixed(1) : "0.0";
  const valAccuracy = splitStats.validation.total > 0 ? ((splitStats.validation.correct / splitStats.validation.total) * 100).toFixed(1) : "0.0";
  const testAccuracy = splitStats.test.total > 0 ? ((splitStats.test.correct / splitStats.test.total) * 100).toFixed(1) : "0.0";

  const visualSupportRate = ((categories.CORRECT_AND_VISUALLY_SUPPORTED / total) * 100).toFixed(1);
  const abstentionRate = ((categories.ABSTAIN / total) * 100).toFixed(1);

  return {
    total_evaluations: total,
    overall_accuracy_pct: parseFloat(overallAccuracy),
    gallery_image_accuracy_pct: parseFloat(galleryAccuracy),
    inscription_accuracy_pct: parseFloat(inscAccuracy),
    split_accuracies: {
      train_sites_pct: parseFloat(trainAccuracy),
      validation_sites_pct: parseFloat(valAccuracy),
      unseen_test_sites_pct: parseFloat(testAccuracy)
    },
    category_breakdown: categories,
    option_distribution: optionDistribution,
    visual_evidence_support_rate_pct: parseFloat(visualSupportRate),
    abstention_rate_pct: parseFloat(abstentionRate),
    confusion_matrix: buildConfusionMatrix(evaluations)
  };
}
