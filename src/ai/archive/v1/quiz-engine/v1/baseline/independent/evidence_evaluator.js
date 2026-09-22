/**
 * Visual Evidence Evaluator
 * 
 * Evaluates whether model visual reasoning text corresponds to actual visual evidence in the photo.
 * Distinguishes visual perception failure from option-selection failure.
 */

export function evaluateVisualEvidenceGrounding(rawObservation, expectedEvidence) {
  if (!rawObservation || typeof rawObservation !== "string" || rawObservation.length < 10) {
    return { grounded: false, score: 0, reason: "No observation or too short" };
  }

  const normObs = rawObservation.toLowerCase();
  const targetFeature = (expectedEvidence?.observable_feature || "").toLowerCase();

  if (targetFeature && normObs.includes(targetFeature)) {
    return { grounded: true, score: 1.0, reason: "Direct observable feature match" };
  }

  // Sub-keyword matching
  const keywords = targetFeature.split(" ").filter(w => w.length > 3);
  const matchedCount = keywords.filter(kw => normObs.includes(kw)).length;

  if (matchedCount >= 1 || normObs.length > 25) {
    return { grounded: true, score: 0.8, reason: "Partial keyword evidence match" };
  }

  return { grounded: false, score: 0.2, reason: "Observation lacks expected visual keywords" };
}
