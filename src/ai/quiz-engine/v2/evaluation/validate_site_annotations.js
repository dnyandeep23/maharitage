const fs = require('fs');
const path = require('path');

const siteId = process.argv[2];
if (!siteId) {
  console.error("Usage: node validate_site_annotations.js <site_id>");
  process.exit(1);
}

const DATASET_DIR = path.join(__dirname, '..', 'dataset');
const SITE_DIR = path.join(DATASET_DIR, siteId);
const TEXT_FILE = path.join(SITE_DIR, 'text', 'annotations.json');
const IMAGE_FILE = path.join(SITE_DIR, 'image', 'annotations.json');

let errors = [];
let seenIds = new Set();

function validateOptionCount(options) {
  if (!options || typeof options !== 'object' || Array.isArray(options)) return false;
  const keys = Object.keys(options);
  if (keys.length !== 4) return false;
  if (!keys.includes('A') || !keys.includes('B') || !keys.includes('C') || !keys.includes('D')) return false;
  return Object.values(options).every(v => typeof v === 'string' && v.trim().length > 0);
}

function checkImageFile(imageFileRelPath) {
  // Expected: image.file = "image/Ell0001/img_001.jpg"
  // But actual path in disk is: dataset/Ell0001/image/images/img_001.jpg
  // Let's resolve it. The relative path stored might just be the literal filename if we want, but the spec said "image/Ell0001/img_001.jpg".
  // Let's extract the basename and check the actual images directory.
  const filename = path.basename(imageFileRelPath);
  const actualPath = path.join(SITE_DIR, 'image', 'images', filename);
  
  if (!fs.existsSync(actualPath)) {
    return { valid: false, error: `File not found: ${actualPath}` };
  }
  const stats = fs.statSync(actualPath);
  if (stats.size === 0) {
    return { valid: false, error: `File is empty (0 bytes): ${actualPath}` };
  }
  // Basic JPEG/PNG signature check could go here, but size > 0 covers basic corruption for now.
  return { valid: true };
}

function validateAnnotation(q, type) {
  const prefix = `[${q.annotation_id || 'UNKNOWN_ID'}]`;

  if (!q.annotation_id) errors.push(`${prefix} Missing annotation_id`);
  else {
    if (seenIds.has(q.annotation_id)) errors.push(`${prefix} Duplicate annotation_id`);
    seenIds.add(q.annotation_id);
  }

  if (q.question_type !== type) errors.push(`${prefix} Invalid question_type: ${q.question_type} (Expected ${type})`);
  
  const validCategories = ["VISUAL_ARCHITECTURE", "VISUAL_SCULPTURE", "VISUAL_MATERIAL", "VISUAL_INSCRIPTION", "ARCHITECTURAL", "HISTORICAL", "CULTURAL_RELIGIOUS", "CHRONOLOGY", "COMPARATIVE_REASONING", "INSCRIPTION", "OTHER"];
  if (!validCategories.includes(q.category)) errors.push(`${prefix} Invalid category: ${q.category}`);

  if (!['EASY', 'MODERATE', 'HARD'].includes(q.difficulty)) errors.push(`${prefix} Invalid difficulty: ${q.difficulty}`);
  if (!q.question_purpose) errors.push(`${prefix} Missing question_purpose`);
  
  if (!['HIGH', 'MEDIUM', 'LOW', 'NONE'].includes(q.visual_dependency)) errors.push(`${prefix} Invalid visual_dependency: ${q.visual_dependency}`);

  if (!['A', 'B', 'C', 'D'].includes(q.answer)) errors.push(`${prefix} Invalid answer format: ${q.answer}`);
  if (!validateOptionCount(q.options)) errors.push(`${prefix} Options must be an object with A, B, C, D string keys`);

  if (!q.source_evidence) errors.push(`${prefix} Missing source_evidence`);
  // Text questions need source_field, images need visual_evidence
  if (type === 'TEXT_MCQ' && !q.source_field) errors.push(`${prefix} TEXT_MCQ missing source_field`);
  if (type === 'IMAGE_MCQ' && !q.visual_evidence) errors.push(`${prefix} IMAGE_MCQ missing visual_evidence`);
  if (type === 'TEXT_MCQ' && q.image) errors.push(`${prefix} TEXT_MCQ should not have an image field`);
  
  if (type === 'IMAGE_MCQ') {
    if (!q.image_id || !q.image_url) {
      errors.push(`${prefix} IMAGE_MCQ missing image_id or image_url`);
    } else if (!q.image_url.includes('cloudinary.com')) {
      errors.push(`${prefix} IMAGE_MCQ image_url must be a valid Cloudinary URL`);
    }
  }

  if (!q.duplicate_group && q.duplicate_group !== null) errors.push(`${prefix} Missing duplicate_group`);
  if (!q.duplicate_type) errors.push(`${prefix} Missing duplicate_type`);
  if (!['KEEP', 'REVISE', 'REJECT', 'DRAFT'].includes(q.review_status)) errors.push(`${prefix} Invalid review_status: ${q.review_status}`);
}

function runValidation() {
  let textCount = 0;
  let imageCount = 0;

  console.log(`Validating site: ${siteId}`);

  if (fs.existsSync(TEXT_FILE)) {
    const textData = JSON.parse(fs.readFileSync(TEXT_FILE, 'utf-8'));
    if (!Array.isArray(textData)) {
      errors.push(`Text annotations file is not an array.`);
    } else {
      textCount = textData.length;
      textData.forEach(q => validateAnnotation(q, 'TEXT_MCQ'));
    }
  }

  if (fs.existsSync(IMAGE_FILE)) {
    const imageData = JSON.parse(fs.readFileSync(IMAGE_FILE, 'utf-8'));
    if (!Array.isArray(imageData)) {
      errors.push(`Image annotations file is not an array.`);
    } else {
      imageCount = imageData.length;
      imageData.forEach(q => validateAnnotation(q, 'IMAGE_MCQ'));
    }
  }

  if (textCount === 0 && imageCount === 0) {
    console.log(`DATA_STATUS = EMPTY`);
  } else {
    console.log(`Found ${textCount} text candidates and ${imageCount} image candidates.`);
  }

  if (errors.length > 0) {
    console.error(`\nValidation Failed with ${errors.length} errors:`);
    errors.forEach(e => console.error("- " + e));
    process.exit(1);
  } else {
    console.log("\nValidation Passed! All schema constraints met.");
  }
}

runValidation();
