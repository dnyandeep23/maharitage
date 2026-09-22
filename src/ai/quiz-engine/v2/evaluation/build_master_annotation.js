const fs = require('fs');
const path = require('path');

const DATASET_DIR = path.join(__dirname, '..', 'dataset');
const GLOBAL_ANNOTATION_DIR = path.join(__dirname, '..', 'annotation');
const IMAGE_BASED_DIR = path.join(DATASET_DIR, 'image_based');
const TEXT_BASED_DIR = path.join(DATASET_DIR, 'text_based');

if (!fs.existsSync(GLOBAL_ANNOTATION_DIR)) fs.mkdirSync(GLOBAL_ANNOTATION_DIR, { recursive: true });
if (!fs.existsSync(IMAGE_BASED_DIR)) fs.mkdirSync(IMAGE_BASED_DIR, { recursive: true });
if (!fs.existsSync(TEXT_BASED_DIR)) fs.mkdirSync(TEXT_BASED_DIR, { recursive: true });

function run() {
  const sites = fs.readdirSync(DATASET_DIR).filter(f => fs.statSync(path.join(DATASET_DIR, f)).isDirectory() && !['image_based', 'text_based', 'splits'].includes(f));

  let globalAnnotations = [];
  let imageBased = [];
  let textBased = [];

  sites.forEach(siteId => {
    const textFile = path.join(DATASET_DIR, siteId, 'text', 'annotations.json');
    if (fs.existsSync(textFile)) {
      const textData = JSON.parse(fs.readFileSync(textFile, 'utf-8'));
      globalAnnotations = globalAnnotations.concat(textData);
      textBased = textBased.concat(textData);
    }

    const imageFile = path.join(DATASET_DIR, siteId, 'image', 'annotations.json');
    if (fs.existsSync(imageFile)) {
      const imageData = JSON.parse(fs.readFileSync(imageFile, 'utf-8'));
      globalAnnotations = globalAnnotations.concat(imageData);
      imageBased = imageBased.concat(imageData);
    }
  });

  fs.writeFileSync(path.join(GLOBAL_ANNOTATION_DIR, 'annotation.json'), JSON.stringify(globalAnnotations, null, 2));
  fs.writeFileSync(path.join(IMAGE_BASED_DIR, 'annotations.json'), JSON.stringify(imageBased, null, 2));
  fs.writeFileSync(path.join(TEXT_BASED_DIR, 'annotations.json'), JSON.stringify(textBased, null, 2));

  console.log(`Master derived indices built.`);
  console.log(`- Global: ${globalAnnotations.length} questions`);
  console.log(`- Image Based: ${imageBased.length} questions`);
  console.log(`- Text Based: ${textBased.length} questions`);
}

run();
