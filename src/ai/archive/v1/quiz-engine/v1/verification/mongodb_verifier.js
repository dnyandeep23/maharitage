/**
 * MongoDB Ground-Truth Verifier
 * 
 * Resolves site_id → MongoDB document → field path → ground-truth value.
 * Rejects annotations where the proposed answer disagrees with MongoDB.
 * Works generically on ANY site document schema (cave or fort).
 */

/**
 * Safely convert any MongoDB value to a clean display string.
 * Handles objects like verification_authority: { curated_by: [...] }
 */
export function toCleanString(val, fallback = "") {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(v => toCleanString(v)).filter(Boolean).join(", ") || fallback;
  if (typeof val === "object") {
    if (val.authority && typeof val.authority === "string") return val.authority;
    if (Array.isArray(val.curated_by) && val.curated_by.length > 0) return val.curated_by.join(", ");
    const flat = Object.values(val).map(v => (typeof v === "object" ? "" : String(v))).filter(Boolean).join(", ");
    return flat || fallback;
  }
  return String(val);
}

/**
 * Resolve a dot-separated field path on a document.
 * Example: resolveField(doc, "location.district") => "Chhatrapati Sambhaji Nagar"
 */
export function resolveField(doc, fieldPath) {
  if (!doc || !fieldPath) return undefined;
  const parts = fieldPath.split(".");
  let current = doc;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    // Handle array index notation like "inscriptions[0]"
    const arrMatch = part.match(/^(.+)\[(\d+)\]$/);
    if (arrMatch) {
      current = current[arrMatch[1]];
      if (Array.isArray(current)) {
        current = current[parseInt(arrMatch[2], 10)];
      } else {
        return undefined;
      }
    } else {
      current = current[part];
    }
  }
  return current;
}

/**
 * Verify that a proposed answer matches the MongoDB ground-truth value.
 */
export function verifyAnswer(siteDoc, fieldPath, proposedAnswer) {
  const groundTruth = resolveField(siteDoc, fieldPath);
  if (groundTruth === undefined || groundTruth === null) {
    return { verified: false, reason: `Field '${fieldPath}' not found in site document` };
  }

  const gtStr = toCleanString(groundTruth).toLowerCase().trim();
  const proposed = toCleanString(proposedAnswer).toLowerCase().trim();

  if (gtStr === proposed) {
    return { verified: true, ground_truth: toCleanString(groundTruth) };
  }

  // Fuzzy: check if one contains the other (handles partial matches)
  if (gtStr.includes(proposed) || proposed.includes(gtStr)) {
    return { verified: true, ground_truth: toCleanString(groundTruth), fuzzy: true };
  }

  return {
    verified: false,
    reason: `Answer mismatch: proposed="${proposed}", ground_truth="${gtStr}"`,
    ground_truth: toCleanString(groundTruth)
  };
}

/**
 * Verify a gallery image URL exists in the site document.
 */
export function verifyGalleryImage(siteDoc, imageUrl) {
  const gallery = Array.isArray(siteDoc.gallary) ? siteDoc.gallary : (Array.isArray(siteDoc.gallery) ? siteDoc.gallery : []);
  const found = gallery.some(url => url === imageUrl);
  return {
    verified: found,
    reason: found ? "Image found in gallery" : `Image URL not found in site gallery`
  };
}

/**
 * Verify an inscription image URL exists in the site document.
 */
export function verifyInscriptionImage(siteDoc, imageUrl) {
  const inscriptions = Array.isArray(siteDoc.inscriptions) ? siteDoc.inscriptions : [];
  for (const insc of inscriptions) {
    const urls = Array.isArray(insc.image_urls) ? insc.image_urls : [];
    if (urls.includes(imageUrl)) {
      return { verified: true, inscription_id: insc.Inscription_id };
    }
  }
  return { verified: false, reason: "Inscription image URL not found in site document" };
}

/**
 * Get the gallery array from a site document (handles 'gallary' typo).
 */
export function getGallery(siteDoc) {
  return Array.isArray(siteDoc.gallary) ? siteDoc.gallary : (Array.isArray(siteDoc.gallery) ? siteDoc.gallery : []);
}

/**
 * Get all inscriptions from a site document.
 */
export function getInscriptions(siteDoc) {
  return Array.isArray(siteDoc.inscriptions) ? siteDoc.inscriptions : [];
}

/**
 * Extract a Cloudinary public_id from a URL.
 * Example: "https://res.cloudinary.com/.../v123/cave17_qckcsr.jpg" => "cave17_qckcsr"
 */
export function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== "string") return "";
  const match = url.match(/\/v\d+\/(.+?)(?:\.\w+)?$/);
  return match ? match[1] : "";
}
