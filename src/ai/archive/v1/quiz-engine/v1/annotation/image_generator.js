/**
 * Rebuilt Site-Agnostic Image Question Generator (TRUE_VISUAL Only)
 * 
 * Generates visual MCQs per gallery image that STRICTLY REQUIRE inspecting the image.
 * Evaluates visual_dependency_score for every candidate:
 *   3 = IMAGE_ESSENTIAL (Accepted)
 *   2 = IMAGE_USEFUL (Rejected for SmolVLM training)
 *   1 = WEAKLY_IMAGE_RELATED (Rejected)
 *   0 = IMAGE_IRRELEVANT / DATABASE_ONLY (Rejected)
 * 
 * Includes visual_evidence in every annotation explaining why the image is required.
 * Rejects all DATABASE_ONLY questions (e.g. "Which district is this in?").
 */

import { toCleanString, getGallery, extractCloudinaryPublicId } from '../verification/mongodb_verifier.js';
import { getVisualFeaturesForImage } from '../verification/visual_grounding_matrix.js';

/**
 * Mandatory Visual Dependency Test:
 * If the image were completely removed, could a person answer the question using only text/general DB knowledge?
 * Returns { score: 3 | 2 | 1 | 0, reason: string }
 */
export function evaluateVisualDependency(question, category, answer) {
  const qLower = (question || "").toLowerCase();

  // EXCLUDE DATABASE-ONLY PATTERNS (Score 0)
  if (qLower.includes("which district") || qLower.includes("in which district") || qLower.includes("administrative region")) {
    return { score: 0, reason: "District location is a text/database fact, not visually observable in the image." };
  }
  if (qLower.includes("which dynasty") && !qLower.includes("visible") && !qLower.includes("depicted")) {
    return { score: 0, reason: "Dynasty patronage is a historical text fact, not directly observable without visual context." };
  }
  if (qLower.includes("what year") || qLower.includes("which century") || qLower.includes("historical period")) {
    return { score: 0, reason: "Chronological period is a database text fact, not visually observable in the image." };
  }
  if (qLower.includes("who built") || qLower.includes("constructed by") || qLower.includes("who commissioned")) {
    return { score: 0, reason: "Patron identity is a text database fact." };
  }
  if (qLower.includes("cultural significance") || qLower.includes("political role")) {
    return { score: 0, reason: "Cultural significance is a text concept, not a visual feature." };
  }

  // TRUE VISUAL PATTERNS (Score 3)
  if (qLower.includes("visible") || qLower.includes("depicted") || qLower.includes("shown in this photograph") ||
      qLower.includes("in this photograph") || qLower.includes("in this image") || qLower.includes("photograph #")) {
    
    // Check if the question asks about observable physical structures
    if (qLower.includes("architectural feature") || qLower.includes("pillar") || qLower.includes("entrance") ||
        qLower.includes("sculpture") || qLower.includes("relief") || qLower.includes("facade") || qLower.includes("façade") ||
        qLower.includes("masonry") || qLower.includes("material") || qLower.includes("gateway") || qLower.includes("bastion") ||
        qLower.includes("tower") || qLower.includes("stupa") || qLower.includes("minar") || qLower.includes("reservoir") ||
        qLower.includes("cannon") || qLower.includes("arch") || qLower.includes("window") || qLower.includes("ridge") ||
        qLower.includes("landscape") || qLower.includes("gorge") || qLower.includes("layout") || qLower.includes("structural") ||
        qLower.includes("identified by this") || qLower.includes("monument is depicted")) {
      return { score: 3, reason: "Question asks about visually observable physical elements in the photograph." };
    }
  }

  // Default score 1 for borderline cases
  return { score: 1, reason: "Question does not explicitly focus on visually observable physical features." };
}

/**
 * Generate TRUE_VISUAL image annotations for ANY site document.
 * Returns { site_id, site_name, images_processed, raw_candidates, accepted_count, rejected_count, annotations, rejected_candidates }.
 */
export function generateImageAnnotations(siteDoc) {
  if (!siteDoc || !siteDoc.site_id) {
    throw new Error("Invalid site document: missing site_id");
  }

  const siteId = toCleanString(siteDoc.site_id);
  const siteName = toCleanString(siteDoc.site_name, "Heritage Site");
  const gallery = getGallery(siteDoc);

  if (gallery.length === 0) {
    return {
      site_id: siteId,
      site_name: siteName,
      images_processed: 0,
      raw_candidates: 0,
      accepted_count: 0,
      rejected_count: 0,
      annotations: [],
      rejected_candidates: []
    };
  }

  const accepted = [];
  const rejected = [];
  let globalSeq = 1;

  for (let gIdx = 0; gIdx < gallery.length; gIdx++) {
    const imgUrl = gallery[gIdx];
    if (!imgUrl || typeof imgUrl !== "string") continue;

    const publicId = extractCloudinaryPublicId(imgUrl);
    const visualData = getVisualFeaturesForImage(imgUrl, siteDoc);
    const features = visualData.visual_features || {};

    for (const [featKey, feat] of Object.entries(features)) {
      if (!feat.question || !feat.answer || !Array.isArray(feat.distractors) || feat.distractors.length < 3) {
        continue;
      }

      // Check visual dependency score
      const depEval = evaluateVisualDependency(feat.question, feat.category, feat.answer);

      // Distractor validation: ensure distractors are distinct from correct answer and clean strings
      const cleanAnswer = toCleanString(feat.answer);
      const cleanDistractors = feat.distractors
        .map(d => toCleanString(d))
        .filter(d => d && d.toLowerCase().trim() !== cleanAnswer.toLowerCase().trim());
      
      const uniqueDistractors = [...new Set(cleanDistractors)].slice(0, 3);
      if (uniqueDistractors.length < 3) {
        rejected.push({
          question: feat.question,
          reason: "Insufficient unique distractors"
        });
        continue;
      }

      const candidate = {
        annotation_id: `${siteId}_img_${String(gIdx + 1).padStart(3, "0")}_q${String(globalSeq).padStart(3, "0")}`,
        site_id: siteId,
        site_name: siteName,
        question_type: "image",
        category: feat.category || "Architectural Feature",
        image_url: imgUrl,
        cloudinary_public_id: publicId,
        gallery_index: gIdx,
        question: feat.question,
        options: [cleanAnswer, ...uniqueDistractors], // Will be option-balanced later
        correct_option_index: 0,
        visual_dependency_score: depEval.score,
        visual_dependency_reason: depEval.reason,
        visual_evidence: feat.evidence || `Visual feature '${featKey}' observable in gallery photograph #${gIdx + 1} of ${siteName}.`,
        source: {
          type: "cloudinary",
          field: `gallary[${gIdx}]`,
          value: cleanAnswer
        }
      };

      // SmovVLM Training Gate: ONLY score === 3 (IMAGE_ESSENTIAL) is accepted
      if (depEval.score === 3) {
        accepted.push(candidate);
        globalSeq++;
      } else {
        rejected.push({
          annotation_id: candidate.annotation_id,
          question: candidate.question,
          score: depEval.score,
          reason: depEval.reason
        });
      }
    }
  }

  return {
    site_id: siteId,
    site_name: siteName,
    images_processed: gallery.length,
    raw_candidates: accepted.length + rejected.length,
    accepted_count: accepted.length,
    rejected_count: rejected.length,
    annotations: accepted,
    rejected_candidates: rejected
  };
}
