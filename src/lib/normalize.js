/**
 * normalize.js
 * 
 * A utility to normalize parsed JSON data. It:
 * 1. Converts all object keys to snake_case.
 * 2. Uses an alias dictionary to correct typos and standardize field names.
 * 3. Deeply traverses arrays and nested objects.
 */

// A mapping of known variations and typos to their standardized snake_case names
const keyAliases = {
  // Description variations
  "site_discription": "site_description",
  "sitedescription": "site_description",
  
  // Gallery variations
  "gallary": "gallery",
  "galleries": "gallery",
  "images": "gallery",
  
  // Naming variations
  "name": "site_name",
  "type": "heritage_type",
  
  // Inscription variations — backward compat for capitalized keys in old datasets
  "inscription_id": "inscription_id",
  "Inscription_id": "inscription_id",
  "Inscription_Id": "inscription_id",
  "discription": "description",   // nested inscription description
  "Discription": "description",
};

/**
 * Convert any string to snake_case
 * e.g., "siteDescription" -> "site_description"
 * "Site Description" -> "site_description"
 */
export function toSnakeCase(str) {
  return str
    .replace(/\W+/g, " ") // Replace non-word chars with space
    .split(/ |\B(?=[A-Z])/) // Split by space or camelCase boundaries
    .map((word) => word.toLowerCase())
    .join("_");
}

/**
 * Standardize a key using snake_case and aliases
 */
export function standardizeKey(key) {
  const snakeKey = toSnakeCase(key);
  return keyAliases[snakeKey] || snakeKey;
}

/**
 * Deep normalize an object or array
 */
export function normalizeData(data) {
  if (Array.isArray(data)) {
    return data.map((item) => normalizeData(item));
  } else if (data !== null && typeof data === "object") {
    const normalizedObject = {};
    for (const [key, value] of Object.entries(data)) {
      const newKey = standardizeKey(key);
      normalizedObject[newKey] = normalizeData(value);
    }
    return normalizedObject;
  }
  return data; // Return primitive values as is
}
