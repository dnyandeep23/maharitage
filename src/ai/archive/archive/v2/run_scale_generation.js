const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');

const uri = process.env.MONGODB_URI || "mongodb+srv://maharitage:Maharitage@cluster0.h05toky.mongodb.net/maharitage?retryWrites=true&w=majority&appName=Cluster0";
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.7 } });

const REPORTS_DIR = path.join(__dirname, '..', 'reports');
const ANNOTATION_DIR = path.join(__dirname, '..', 'annotation');
const DATASET_DIR = path.join(__dirname, '..', 'dataset');
const SPLITS_DIR = path.join(DATASET_DIR, 'splits');
const IMG_BASED_DIR = path.join(DATASET_DIR, 'image_based');
const TXT_BASED_DIR = path.join(DATASET_DIR, 'text_based');

[REPORTS_DIR, ANNOTATION_DIR, DATASET_DIR, SPLITS_DIR, IMG_BASED_DIR, TXT_BASED_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function fetchImageBase64(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const data = [];
      res.on('data', (chunk) => data.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(data);
        resolve(buffer.toString('base64'));
      });
    }).on('error', reject);
  });
}

function stringSimilarity(s1, s2) {
  const words1 = s1.toLowerCase().split(/\W+/);
  const words2 = s2.toLowerCase().split(/\W+/);
  const intersection = words1.filter(x => words2.includes(x));
  return intersection.length / Math.max(words1.length, words2.length);
}

function generateId(siteId, qType, idx) {
  return `v2_${siteId}_${qType === 'IMAGE_MCQ' ? 'img' : 'text'}_${String(idx).padStart(3, '0')}`;
}

async function run() {
  let dbConnection;
  try {
    dbConnection = await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const sitesCollection = db.collection('sites');

    // Fetch 15 sites that have images
    const sites = await sitesCollection.aggregate([
      { $match: { gallary: { $exists: true, $not: { $size: 0 } } } },
      { $sample: { size: 15 } }
    ]).toArray();

    const allAccepted = [];
    let stats = {
      sites_used: sites.length,
      images_used: 0,
      generated: 0,
      keep: 0,
      revise: 0,
      reject: 0,
      modality: { IMAGE_MCQ: 0, TEXT_MCQ: 0 },
      difficulty: { EASY: 0, MODERATE: 0, HARD: 0 },
      category: {},
      visual_dependency: { HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 },
      duplicates_rejected: 0
    };

    let globalCounter = 1;

    for (let i = 0; i < sites.length; i++) {
      const site = sites[i];
      // Pick 1 image per site, sometimes 2 if available to hit ~20 images
      let imagesToProcess = [site.gallary[0]];
      if (i < 5 && site.gallary.length > 1) {
        imagesToProcess.push(site.gallary[1]);
      }

      for (let imgIdx = 0; imgIdx < imagesToProcess.length; imgIdx++) {
        const imageUrl = imagesToProcess[imgIdx];
        stats.images_used++;
        console.log(`[${stats.images_used}] Processing site: ${site.site_name}`);
        
        const base64Img = await fetchImageBase64(imageUrl);
        const imgPart = { inlineData: { data: base64Img, mimeType: "image/jpeg" } };

        const contextStr = JSON.stringify({
          heritage_type: site.heritage_type,
          period: site.period,
          historical_context: site.historical_context
        });

        // PASS A - VISUAL GENERATION
        const visualPrompt = `
You are an expert heritage quiz generator. Generate 5-6 DISTINCT multiple-choice question candidates based ONLY on observable visual evidence in this image.
Do NOT use historical names or metadata. Identify features solely by what is visible (architecture, sculpture, material, construction).
Do NOT ask about camera angle, perspective, framing, photography style, lighting, or composition.
Do not invent facts.

Every question must:
- have exactly four options (A, B, C, D)
- have exactly one correct answer
- identify question_purpose (must be VISUAL)
- identify visual_dependency (HIGH or MEDIUM)
- have visible_feature (what exact feature is visible?)
- have visual_evidence (what visible evidence supports the answer?)

Output JSON array of objects:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "answer": "A, B, C or D",
  "category": "VISUAL_ARCHITECTURE|VISUAL_SCULPTURE|VISUAL_MATERIAL",
  "difficulty": "EASY|MODERATE|HARD",
  "question_purpose": "VISUAL",
  "visual_dependency": "HIGH|MEDIUM",
  "visible_feature": "string",
  "visual_evidence": "string",
  "source_evidence": "IMAGE_EVIDENCE"
}
`;

        // PASS B - CONTEXT GENERATION
        const contextPrompt = `
You are an expert heritage quiz generator. Generate 5-6 DISTINCT multiple-choice question candidates using the provided historical context. The image is provided merely as a reference.
Every question must:
- have exactly four options (A, B, C, D)
- have exactly one correct answer
- identify question_purpose (HISTORICAL_CONTEXT, CULTURAL_CONTEXT, CHRONOLOGY, COMPARATIVE_REASONING)
- identify visual_dependency (LOW or NONE)
- have source_evidence (quote from context)

Output JSON array of objects:
{
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "answer": "A, B, C or D",
  "category": "HISTORICAL|ARCHITECTURAL|CULTURAL_RELIGIOUS",
  "difficulty": "EASY|MODERATE|HARD",
  "question_purpose": "string",
  "visual_dependency": "LOW|NONE",
  "source_evidence": "string",
  "visible_feature": null,
  "visual_evidence": null
}
Context: ${contextStr}
`;

        const sleep = ms => new Promise(r => setTimeout(r, ms));
        
        let generatedData = [];
        let successA = false;
        while (!successA) {
          try {
            const resultA = await model.generateContent([visualPrompt, imgPart]);
            generatedData = generatedData.concat(JSON.parse(resultA.response.text()));
            successA = true;
          } catch (err) { 
            console.error("Visual Pass Error:", err.message); 
            if (err.message.includes('429')) await sleep(30000);
            else successA = true; 
          }
        }

        await sleep(15000); // 15 second delay to avoid rate limit

        let successB = false;
        while (!successB) {
          try {
            const resultB = await model.generateContent([contextPrompt, imgPart]);
            generatedData = generatedData.concat(JSON.parse(resultB.response.text()));
            successB = true;
          } catch (err) { 
            console.error("Context Pass Error:", err.message); 
            if (err.message.includes('429')) await sleep(30000);
            else successB = true; 
          }
        }

        await sleep(15000); // 15 second delay to avoid rate limit

        // Deduplication & Validation
        for (let c = 0; c < generatedData.length; c++) {
          let item = generatedData[c];
          stats.generated++;
          
          let status = 'KEEP';
          let duplicateType = "UNIQUE";

          for (let j = 0; j < c; j++) {
            const prev = generatedData[j];
            const ansStr1 = item.options ? item.options[item.answer.charCodeAt(0) - 65] : "";
            const ansStr2 = prev.options ? prev.options[prev.answer.charCodeAt(0) - 65] : "";
            if (ansStr1 && ansStr2 && ansStr1.toLowerCase() === ansStr2.toLowerCase()) {
              duplicateType = "SAME_FACT";
              break;
            }
            if (stringSimilarity(item.question, prev.question) > 0.65) {
              duplicateType = "SAME_FACT";
              break;
            }
          }

          if (duplicateType !== 'UNIQUE') {
            status = 'REJECT';
            stats.duplicates_rejected++;
          } else if (!item.options || item.options.length !== 4) {
            status = 'REJECT';
          } else if (item.question_purpose === 'VISUAL' && (!item.visual_evidence || !item.visible_feature)) {
            status = 'REJECT';
          } else {
            const promptStr = JSON.stringify(item).toLowerCase();
            if (promptStr.includes('camera') || promptStr.includes('composition')) {
              status = 'REJECT';
            }
          }

          if (status === 'KEEP') {
            item.annotation_id = generateId(site.site_id, item.question_purpose === 'VISUAL' ? 'IMAGE_MCQ' : 'TEXT_MCQ', globalCounter++);
            item.site_id = site.site_id;
            item.image_url = imageUrl;
            item.question_type = item.question_purpose === 'VISUAL' ? 'IMAGE_MCQ' : 'TEXT_MCQ';
            item.review_status = 'APPROVED';
            
            allAccepted.push(item);
            stats.keep++;
            stats.modality[item.question_type]++;
            stats.difficulty[item.difficulty] = (stats.difficulty[item.difficulty] || 0) + 1;
            stats.category[item.category] = (stats.category[item.category] || 0) + 1;
            stats.visual_dependency[item.visual_dependency]++;
          } else {
            stats.reject++;
          }
        }
      }
    }

    // Split logic
    // We have sites.length sites (15).
    // Train = 70% (10), Val = 15% (2), Test = 15% (3)
    const trainSites = sites.slice(0, 10).map(s => s.site_id);
    const valSites = sites.slice(10, 12).map(s => s.site_id);
    const testSites = sites.slice(12, 15).map(s => s.site_id);

    const trainSplit = allAccepted.filter(a => trainSites.includes(a.site_id)).map(a => ({ annotation_id: a.annotation_id, site_id: a.site_id }));
    const valSplit = allAccepted.filter(a => valSites.includes(a.site_id)).map(a => ({ annotation_id: a.annotation_id, site_id: a.site_id }));
    const testSplit = allAccepted.filter(a => testSites.includes(a.site_id)).map(a => ({ annotation_id: a.annotation_id, site_id: a.site_id }));

    fs.writeFileSync(path.join(SPLITS_DIR, 'train.json'), JSON.stringify(trainSplit, null, 2));
    fs.writeFileSync(path.join(SPLITS_DIR, 'validation.json'), JSON.stringify(valSplit, null, 2));
    fs.writeFileSync(path.join(SPLITS_DIR, 'test.json'), JSON.stringify(testSplit, null, 2));

    fs.writeFileSync(path.join(ANNOTATION_DIR, 'annotation.json'), JSON.stringify(allAccepted, null, 2));
    fs.writeFileSync(path.join(IMG_BASED_DIR, 'annotations.json'), JSON.stringify(allAccepted.filter(a => a.question_type === 'IMAGE_MCQ'), null, 2));
    fs.writeFileSync(path.join(TXT_BASED_DIR, 'annotations.json'), JSON.stringify(allAccepted.filter(a => a.question_type === 'TEXT_MCQ'), null, 2));

    const repMd = `# V2 Large Dataset Generation Report

## Execution Summary
- **Sites Used**: ${stats.sites_used}
- **Images Used**: ${stats.images_used}
- **Candidates Generated**: ${stats.generated}
- **Candidates Kept**: ${stats.keep}
- **Candidates Rejected/Revised**: ${stats.reject}
- **Duplicates Rejected**: ${stats.duplicates_rejected}
- **Acceptance Rate**: ${((stats.keep / stats.generated) * 100).toFixed(1)}%
- **Accepted Questions/Image**: ${(stats.keep / stats.images_used).toFixed(2)}

## Distribution Targets
**Modality**
- IMAGE_MCQ: ${stats.modality.IMAGE_MCQ} (${((stats.modality.IMAGE_MCQ / stats.keep) * 100).toFixed(1)}%)
- TEXT_MCQ: ${stats.modality.TEXT_MCQ} (${((stats.modality.TEXT_MCQ / stats.keep) * 100).toFixed(1)}%)

**Difficulty**
- EASY: ${stats.difficulty.EASY} (${((stats.difficulty.EASY / stats.keep) * 100).toFixed(1)}%)
- MODERATE: ${stats.difficulty.MODERATE} (${((stats.difficulty.MODERATE / stats.keep) * 100).toFixed(1)}%)
- HARD: ${stats.difficulty.HARD} (${((stats.difficulty.HARD / stats.keep) * 100).toFixed(1)}%)

**Visual Dependency**
- HIGH: ${stats.visual_dependency.HIGH}
- MEDIUM: ${stats.visual_dependency.MEDIUM}
- LOW: ${stats.visual_dependency.LOW}
- NONE: ${stats.visual_dependency.NONE}

## Category Breakdown
${Object.keys(stats.category).map(k => `- ${k}: ${stats.category[k]}`).join('\n')}

## Split Strategy (Site-Level)
- **Train Split (70%)**: ${trainSites.length} sites (${trainSplit.length} questions)
- **Validation Split (15%)**: ${valSites.length} sites (${valSplit.length} questions)
- **Test Split (15%)**: ${testSites.length} sites (${testSplit.length} questions)

**STATUS**: DRAFT DATASET GENERATED
`;
    fs.writeFileSync(path.join(REPORTS_DIR, 'large_dataset_generation_report.md'), repMd);
    console.log("Scale generation complete! All files generated.");

  } catch (error) {
    console.error("Error running scale generation:", error);
  } finally {
    if (dbConnection) await mongoose.disconnect();
  }
}

run();
