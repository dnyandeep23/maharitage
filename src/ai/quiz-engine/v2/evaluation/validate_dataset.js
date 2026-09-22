const fs = require('fs');
const path = require('path');

const GLOBAL_ANNOTATIONS = path.join(__dirname, '..', 'annotation', 'annotation.json');

function run() {
  if (!fs.existsSync(GLOBAL_ANNOTATIONS)) {
    console.log("Global annotations file not found. Ensure build_master_annotation.js is run first.");
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(GLOBAL_ANNOTATIONS, 'utf-8'));
  if (!Array.isArray(data)) {
    console.error("Global annotations is not an array.");
    process.exit(1);
  }

  if (data.length === 0) {
    console.log("DATA_STATUS = EMPTY");
    process.exit(0);
  }

  const errors = [];
  const idSet = new Set();
  
  let textCount = 0;
  let imageCount = 0;
  let categories = {};
  let difficulties = {};
  let visualDeps = {};
  let duplicateGroups = 0;

  data.forEach(q => {
    // Uniqueness
    if (idSet.has(q.annotation_id)) errors.push(`Duplicate global ID found: ${q.annotation_id}`);
    idSet.add(q.annotation_id);

    // Counts
    if (q.question_type === 'TEXT_MCQ') textCount++;
    else if (q.question_type === 'IMAGE_MCQ') imageCount++;

    // Category Distribution
    categories[q.category] = (categories[q.category] || 0) + 1;

    // Difficulty
    difficulties[q.difficulty] = (difficulties[q.difficulty] || 0) + 1;

    // Visual Dependency
    if (q.visual_dependency) {
      visualDeps[q.visual_dependency] = (visualDeps[q.visual_dependency] || 0) + 1;
    }

    if (q.duplicate_group !== null) duplicateGroups++;
    
    if (!q.source_evidence) errors.push(`Missing source evidence on ${q.annotation_id}`);
    if (q.question_type === 'IMAGE_MCQ' && !( (q.image_id && q.image_url) || (q.image && q.image.file) )) errors.push(`Missing image asset path on ${q.annotation_id}`);
  });

  if (errors.length > 0) {
    console.error(`Global Validation Failed with ${errors.length} errors:`);
    errors.forEach(e => console.error("- " + e));
    process.exit(1);
  } else {
    console.log("Global Validation Passed!");
    console.log(`\nMetrics:`);
    console.log(`- Total Questions: ${data.length}`);
    console.log(`- Text Questions: ${textCount}`);
    console.log(`- Image Questions: ${imageCount}`);
    console.log(`- Duplicate Groups Tracked: ${duplicateGroups}`);
    
    console.log(`\nCategory Distribution:`);
    Object.entries(categories).forEach(([cat, count]) => console.log(`  - ${cat}: ${count}`));

    console.log(`\nDifficulty Distribution:`);
    Object.entries(difficulties).forEach(([diff, count]) => console.log(`  - ${diff}: ${count}`));

    console.log(`\nVisual Dependency Distribution:`);
    Object.entries(visualDeps).forEach(([dep, count]) => console.log(`  - ${dep}: ${count}`));
  }
}

run();
