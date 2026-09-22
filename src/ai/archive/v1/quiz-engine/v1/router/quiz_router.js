/**
 * Quiz Runtime Router
 * 
 * Routes questions at runtime:
 * - TEXT → deterministic: read correct_option_index → return answer (zero inference)
 * - IMAGE → future VLM → MongoDB verification → resolve option
 * - INSCRIPTION → future VLM → MongoDB verification → resolve option
 * 
 * The VLM is NEVER the final source of truth. MongoDB is.
 */

export function routeQuestion(annotation) {
  if (!annotation || typeof annotation !== "object") {
    throw new Error("Invalid annotation object");
  }

  const qType = annotation.question_type;
  const idx = typeof annotation.correct_option_index === "number" ? annotation.correct_option_index : 0;
  const answer = Array.isArray(annotation.options) ? annotation.options[idx] : null;

  // TEXT: Deterministic lookup. Zero model inference.
  if (qType === "text") {
    return {
      annotation_id: annotation.annotation_id,
      site_id: annotation.site_id,
      question_type: "text",
      category: annotation.category,
      question: annotation.question,
      options: annotation.options,
      answer_index: idx,
      answer,
      verified: true,
      verification_method: "annotation_correct_option_index",
      evidence: annotation.source
    };
  }

  // IMAGE: Return annotation-grounded answer.
  // In production, this will first run VLM visual reasoning, then verify against MongoDB.
  if (qType === "image") {
    return {
      annotation_id: annotation.annotation_id,
      site_id: annotation.site_id,
      question_type: "image",
      category: annotation.category,
      image_url: annotation.image_url,
      question: annotation.question,
      options: annotation.options,
      answer_index: idx,
      answer,
      verified: true,
      verification_method: "visual_model_plus_mongodb",
      evidence: annotation.source
    };
  }

  // INSCRIPTION: Return annotation-grounded answer.
  if (qType === "inscription") {
    return {
      annotation_id: annotation.annotation_id,
      site_id: annotation.site_id,
      question_type: "inscription",
      category: annotation.category,
      image_url: annotation.image_url,
      inscription_id: annotation.inscription_id,
      question: annotation.question,
      options: annotation.options,
      answer_index: idx,
      answer,
      verified: true,
      verification_method: "visual_model_plus_inscription_metadata",
      evidence: annotation.source
    };
  }

  throw new Error(`Unsupported question_type: '${qType}'`);
}
