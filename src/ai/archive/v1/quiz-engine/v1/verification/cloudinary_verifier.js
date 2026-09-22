/**
 * Cloudinary Asset Verifier
 * 
 * Verifies that Cloudinary image URLs are accessible via HTTP HEAD request.
 * Works for gallery images, inscription scans, and architectural feature images.
 */

/**
 * Check if a Cloudinary URL is accessible. Returns { accessible, status, url }.
 * Uses a lightweight HEAD request.
 */
export async function verifyCloudinaryUrl(url) {
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return { accessible: false, status: 0, url, reason: "Invalid or empty URL" };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal
    });

    clearTimeout(timeout);

    return {
      accessible: response.ok,
      status: response.status,
      url,
      reason: response.ok ? "OK" : `HTTP ${response.status}`
    };
  } catch (err) {
    return {
      accessible: false,
      status: 0,
      url,
      reason: err.name === "AbortError" ? "Timeout" : err.message
    };
  }
}

/**
 * Batch-verify an array of Cloudinary URLs.
 * Returns { results[], accessible_count, failed_count }.
 */
export async function verifyCloudinaryBatch(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return { results: [], accessible_count: 0, failed_count: 0 };
  }

  const results = [];
  // Process sequentially to avoid overwhelming Cloudinary
  for (const url of urls) {
    const result = await verifyCloudinaryUrl(url);
    results.push(result);
  }

  const accessible_count = results.filter(r => r.accessible).length;
  return {
    results,
    accessible_count,
    failed_count: results.length - accessible_count
  };
}
