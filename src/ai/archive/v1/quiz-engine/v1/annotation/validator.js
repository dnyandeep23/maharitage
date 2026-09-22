/**
 * Rebuilt 20-Point Annotation Validator (With Visual Grounding Gate)
 * 
 * Validates every annotation against a strict checklist.
 * For visual questions (image & inscription), strictly requires:
 *   - visual_dependency_score === 3 (IMAGE_ESSENTIAL)
 *   - visual_evidence is present and non-empty string
 *   - options are semantically valid and distinct
 *   - NO generic distractors ("Data unavailable", "Unknown", "Not applicable", etc.)
 */

const VALID_QUESTION_TYPES = ["text", "image", "inscription"];
const GENERIC_DISTRACTOR_TERMS = [
  "data unavailable", "unknown", "not applicable", "none of the above", "other",
  "not identifiable from this image", "requires closer inspection", "cannot be determined",
  "not documented", "requires further analysis", "requires further research"
];

export function validateAnnotation(annotation) {
  const errors = [];

  // 1. Required fields
  const required = ["annotation_id", "site_id", "site_name", "question_type", "category", "question", "options", "correct_option_index", "source"];
  for (const field of required) {
    if (annotation[field] === undefined || annotation[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // 2. Question type is valid
  if (annotation.question_type && !VALID_QUESTION_TYPES.includes(annotation.question_type)) {
    errors.push(`Invalid question_type: '${annotation.question_type}'`);
  }

  // 3. Exactly four options
  if (!Array.isArray(annotation.options) || annotation.options.length !== 4) {
    errors.push(`Options must be an array of exactly 4 items, got ${Array.isArray(annotation.options) ? annotation.options.length : typeof annotation.options}`);
  }

  // 4. correct_option_index is 0–3
  if (typeof annotation.correct_option_index !== "number" || annotation.correct_option_index < 0 || annotation.correct_option_index > 3) {
    errors.push(`correct_option_index must be 0–3, got ${annotation.correct_option_index}`);
  }

  // 5. options[correct_option_index] is a non-empty string
  if (Array.isArray(annotation.options) && typeof annotation.correct_option_index === "number") {
    const correctOption = annotation.options[annotation.correct_option_index];
    if (!correctOption || (typeof correctOption === "string" && correctOption.trim().length === 0)) {
      errors.push("Correct option is empty");
    }
  }

  // 6. Options are all non-empty strings and not objects
  if (Array.isArray(annotation.options)) {
    const optSet = new Set();
    for (let i = 0; i < annotation.options.length; i++) {
      const opt = annotation.options[i];
      if (typeof opt !== "string" || opt.trim().length === 0) {
        errors.push(`Option ${i} is empty or not a string`);
      }
      if (typeof opt === "object") {
        errors.push(`Option ${i} is an object (React safety violation)`);
      }
      const normOpt = (typeof opt === "string" ? opt.toLowerCase().trim() : "");
      if (optSet.has(normOpt)) {
        errors.push(`Duplicate option content detected at option ${i}`);
      }
      optSet.add(normOpt);

      // Check for forbidden generic distractor terms
      if (GENERIC_DISTRACTOR_TERMS.includes(normOpt)) {
        errors.push(`Option ${i} uses forbidden generic distractor: '${opt}'`);
      }
    }
  }

  // 7. Source object exists and has required fields
  if (annotation.source) {
    if (!annotation.source.type || !["mongodb", "cloudinary"].includes(annotation.source.type)) {
      errors.push(`Source type must be 'mongodb' or 'cloudinary', got '${annotation.source.type}'`);
    }
    if (!annotation.source.field) {
      errors.push("Source field is missing");
    }
  }

  // 8. Visual Dependency Gate for Image and Inscription questions
  if (annotation.question_type === "image" || annotation.question_type === "inscription") {
    if (annotation.visual_dependency_score !== 3) {
      errors.push(`Visual dependency score must be 3 (IMAGE_ESSENTIAL), got ${annotation.visual_dependency_score}`);
    }
    if (!annotation.visual_evidence || typeof annotation.visual_evidence !== "string" || annotation.visual_evidence.trim().length < 10) {
      errors.push("Visual evidence explanation (visual_evidence) is missing or too short");
    }
    if (!annotation.image_url || typeof annotation.image_url !== "string" || (!annotation.image_url.startsWith("http://") && !annotation.image_url.startsWith("https://"))) {
      errors.push("image_url must be a valid HTTP/HTTPS URL");
    }
    if (!annotation.cloudinary_public_id) {
      errors.push("cloudinary_public_id is missing");
    }
  }

  // 9. Inscription specific check
  if (annotation.question_type === "inscription" && !annotation.inscription_id) {
    errors.push("Inscription annotation requires inscription_id");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
