/**
 * Rebuilt Semantic Duplicate Detector
 * 
 * Performs multi-stage deduplication:
 * 1. Exact match
 * 2. Normalized text match
 * 3. Jaccard similarity (> 0.70)
 * 4. Visual task concept match per image URL / site
 */

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

/**
 * Deduplicate visual annotations.
 * Returns { unique[], duplicates[] }.
 */
export function deduplicateQuestions(annotations) {
  if (!Array.isArray(annotations) || annotations.length === 0) {
    return { unique: [], duplicates: [] };
  }

  const unique = [];
  const duplicates = [];

  // Group by scope
  const groups = {};
  for (const ann of annotations) {
    let key;
    if (ann.question_type === "text") key = `text_${ann.site_id}`;
    else key = `${ann.question_type}_${ann.image_url || ann.site_id}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(ann);
  }

  for (const groupKey of Object.keys(groups)) {
    const group = groups[groupKey];
    const acceptedInGroup = [];

    for (const ann of group) {
      const normQ = normalize(ann.question);
      const cat = ann.category || "";

      // Check 1: Exact match
      const exactDup = acceptedInGroup.some(a => normalize(a.question) === normQ);
      if (exactDup) {
        duplicates.push(ann);
        continue;
      }

      // Check 2: Jaccard similarity > 0.70
      const semanticDup = acceptedInGroup.some(a => jaccardSimilarity(a.question, ann.question) > 0.70);
      if (semanticDup) {
        duplicates.push(ann);
        continue;
      }

      // Check 3: Same category/task duplicate within the same image
      const categoryDup = acceptedInGroup.some(a => a.category === cat && a.question_type !== "text");
      if (categoryDup) {
        // Keep category diversity per image
        duplicates.push(ann);
        continue;
      }

      acceptedInGroup.push(ann);
    }

    unique.push(...acceptedInGroup);
  }

  return { unique, duplicates };
}
