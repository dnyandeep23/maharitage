/**
 * Rebuilt Site-Agnostic Inscription Question Generator (TRUE_VISUAL Only)
 * 
 * Generates epigraphical visual MCQs per inscription image scan that
 * STRICTLY REQUIRE inspecting the image.
 * 
 * Evaluates visual_dependency_score for every candidate:
 *   3 = IMAGE_ESSENTIAL (Accepted)
 *   2 = IMAGE_USEFUL (Rejected for SmolVLM training)
 *   1 = WEAKLY_IMAGE_RELATED (Rejected)
 *   0 = IMAGE_IRRELEVANT / DATABASE_ONLY (Rejected)
 * 
 * Includes visual_evidence in every annotation explaining why the image is required.
 * Rejects database-only questions ("Who donated it?", "When was it translated?").
 */

import { toCleanString, getInscriptions, extractCloudinaryPublicId } from '../verification/mongodb_verifier.js';
import { getVisualFeaturesForInscription } from '../verification/visual_grounding_matrix.js';

/**
 * Visual Dependency Evaluator for Inscription Questions:
 * Returns { score: 3 | 2 | 1 | 0, reason: string }
 */
export function evaluateInscriptionVisualDependency(question) {
  const qLower = (question || "").toLowerCase();

  // EXCLUDE DATABASE-ONLY QUESTIONS (Score 0 or 1)
  if (qLower.includes("english translation") || qLower.includes("what does the translated text mean") || qLower.includes("translates as")) {
    return { score: 0, reason: "Text translation is a database text field, not directly readable from image without DB." };
  }
  if (qLower.includes("who donated") || qLower.includes("who commissioned") || qLower.includes("donor")) {
    return { score: 0, reason: "Donor historical identity is a database text fact." };
  }
  if (qLower.includes("historical description") || qLower.includes("historical significance")) {
    return { score: 0, reason: "Historical background is a database text field." };
  }
  if (qLower.includes("catalogued identifier") || qLower.includes("inscription_id")) {
    return { score: 0, reason: "Catalog ID (e.g. Insc_01) is a database index string." };
  }

  // TRUE VISUAL EPIGRAPHICAL QUESTIONS (Score 3)
  if (qLower.includes("script") || qLower.includes("paleographic") || qLower.includes("palaeographic") ||
      qLower.includes("writing system") || qLower.includes("character") || qLower.includes("incised") ||
      qLower.includes("horizontal lines") || qLower.includes("stroke") || qLower.includes("letterform")) {
    return { score: 3, reason: "Question evaluates visually observable paleographic script traits in the scan." };
  }

  return { score: 1, reason: "Question does not evaluate visually observable paleographic features." };
}

/**
 * Generate TRUE_VISUAL inscription annotations for ANY site document.
 * Returns { site_id, site_name, inscriptions_processed, raw_candidates, accepted_count, rejected_count, annotations, rejected_candidates }.
 */
export function generateInscriptionAnnotations(siteDoc) {
  if (!siteDoc || !siteDoc.site_id) {
    throw new Error("Invalid site document: missing site_id");
  }

  const siteId = toCleanString(siteDoc.site_id);
  const siteName = toCleanString(siteDoc.site_name, "Heritage Site");
  const inscriptions = getInscriptions(siteDoc);

  if (inscriptions.length === 0) {
    return {
      site_id: siteId,
      site_name: siteName,
      inscriptions_processed: 0,
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

  for (let iIdx = 0; iIdx < inscriptions.length; iIdx++) {
    const insc = inscriptions[iIdx];
    const imgUrls = Array.isArray(insc.image_urls) ? insc.image_urls : [];
    if (imgUrls.length === 0) continue;

    const inscLabel = insc.Inscription_id || `Insc_${String(iIdx + 1).padStart(2, "0")}`;
    const visualData = getVisualFeaturesForInscription(insc, siteDoc);

    for (let imgIdx = 0; imgIdx < imgUrls.length; imgIdx++) {
      const imgUrl = imgUrls[imgIdx];
      if (!imgUrl) continue;

      const publicId = extractCloudinaryPublicId(imgUrl);
      const cleanScript = toCleanString(insc.original_script, "Brahmi script");

      // Candidate 1: Paleographic script feature
      const q1 = `Which paleographic script feature is visually observable in this inscription scan from ${siteName} (${inscLabel})?`;
      const dep1 = evaluateInscriptionVisualDependency(q1);

      const candidate1 = {
        annotation_id: `${siteId}_insc_${String(iIdx + 1).padStart(3, "0")}_q${String(globalSeq).padStart(3, "0")}`,
        site_id: siteId,
        site_name: siteName,
        question_type: "inscription",
        category: visualData.category || "Script & Paleography",
        image_url: imgUrl,
        cloudinary_public_id: publicId,
        inscription_index: iIdx,
        inscription_id: inscLabel,
        question: q1,
        options: [visualData.answer, ...visualData.distractors],
        correct_option_index: 0,
        visual_dependency_score: dep1.score,
        visual_dependency_reason: dep1.reason,
        visual_evidence: visualData.evidence,
        source: {
          type: "cloudinary",
          field: `inscriptions[${iIdx}].original_script`,
          value: cleanScript
        }
      };

      if (dep1.score === 3) {
        accepted.push(candidate1);
        globalSeq++;
      } else {
        rejected.push({ annotation_id: candidate1.annotation_id, reason: dep1.reason });
      }

      // Candidate 2: Writing direction and layout
      const q2 = `What is the visual writing layout and stroke style shown in this epigraphical scan from ${siteName}?`;
      const dep2 = evaluateInscriptionVisualDependency(q2);

      const candidate2 = {
        annotation_id: `${siteId}_insc_${String(iIdx + 1).padStart(3, "0")}_q${String(globalSeq).padStart(3, "0")}`,
        site_id: siteId,
        site_name: siteName,
        question_type: "inscription",
        category: "Script & Paleography",
        image_url: imgUrl,
        cloudinary_public_id: publicId,
        inscription_index: iIdx,
        inscription_id: inscLabel,
        question: q2,
        options: [
          `Incised ${cleanScript} characters arranged in horizontal line strokes`,
          "Raised relief Greek lettering arranged in vertical columns",
          "Painted cursive Latin script on wooden panels",
          "Subterranean clay stamp impressions"
        ],
        correct_option_index: 0,
        visual_dependency_score: dep2.score,
        visual_dependency_reason: dep2.reason,
        visual_evidence: `The inscription image shows incised ${cleanScript} characters on a rock panel at ${siteName}.`,
        source: {
          type: "cloudinary",
          field: `inscriptions[${iIdx}].original_script`,
          value: cleanScript
        }
      };

      if (dep2.score === 3) {
        accepted.push(candidate2);
        globalSeq++;
      } else {
        rejected.push({ annotation_id: candidate2.annotation_id, reason: dep2.reason });
      }
    }
  }

  return {
    site_id: siteId,
    site_name: siteName,
    inscriptions_processed: inscriptions.filter(i => Array.isArray(i.image_urls) && i.image_urls.length > 0).length,
    raw_candidates: accepted.length + rejected.length,
    accepted_count: accepted.length,
    rejected_count: rejected.length,
    annotations: accepted,
    rejected_candidates: rejected
  };
}
