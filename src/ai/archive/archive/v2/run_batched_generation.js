const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const https = require('https');

if (!process.env.MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is required.");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("ERROR: GEMINI_API_KEY environment variable is required.");
  process.exit(1);
}

const uri = process.env.MONGODB_URI;
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: { responseMimeType: "application/json", temperature: 0.7 } });

const DATASET_DIR = path.join(__dirname, '..', 'dataset');
const STATE_FILE = path.join(DATASET_DIR, 'generation_state.json');
const ANNOTATIONS_FILE = path.join(DATASET_DIR, 'generation_candidates.json');

const BATCH_SIZE = 3;
const MAX_RETRIES = 3;

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

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  let dbConnection;
  try {
    if (!fs.existsSync(STATE_FILE)) {
      console.error("ERROR: generation_state.json not found. Run init_generation_state.js first.");
      process.exit(1);
    }

    let state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    let pendingImages = state.filter(s => s.status === 'PENDING' || (s.status === 'FAILED_QUOTA' && s.retry_count < MAX_RETRIES));

    if (pendingImages.length === 0) {
      console.log("No pending images found. Generation complete or quota permanently exhausted.");
      return;
    }

    const batch = pendingImages.slice(0, BATCH_SIZE);
    console.log(`Starting batched generation for ${batch.length} images...`);

    dbConnection = await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const sitesCollection = db.collection('sites');

    let allCandidates = [];
    if (fs.existsSync(ANNOTATIONS_FILE)) {
      allCandidates = JSON.parse(fs.readFileSync(ANNOTATIONS_FILE, 'utf-8'));
    }

    for (const item of batch) {
      item.status = 'IN_PROGRESS';
      item.last_attempt = new Date().toISOString();
      fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

      try {
        const site = await sitesCollection.findOne({ site_id: item.site_id });
        if (!site) throw new Error("Site not found in DB");

        console.log(`Processing [${item.image_id}] for site: ${site.site_name}`);
        const base64Img = await fetchImageBase64(item.image_url);
        const imgPart = { inlineData: { data: base64Img, mimeType: "image/jpeg" } };

        const contextStr = JSON.stringify({
          heritage_type: site.heritage_type,
          period: site.period,
          historical_context: site.historical_context
        });

        const visualPrompt = `
You are an expert heritage quiz generator. Generate 5-6 DISTINCT multiple-choice question candidates based ONLY on observable visual evidence in this image.
Do NOT use historical names or metadata. Identify features solely by what is visible.
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

        let generatedData = [];
        
        // Pass A
        try {
          const resultA = await model.generateContent([visualPrompt, imgPart]);
          generatedData = generatedData.concat(JSON.parse(resultA.response.text()));
        } catch (err) {
          if (err.message.includes('429')) throw new Error('QUOTA_EXHAUSTED');
          console.error("Visual Pass Error:", err.message);
        }

        // Pass B
        try {
          const resultB = await model.generateContent([contextPrompt, imgPart]);
          generatedData = generatedData.concat(JSON.parse(resultB.response.text()));
        } catch (err) {
          if (err.message.includes('429')) throw new Error('QUOTA_EXHAUSTED');
          console.error("Context Pass Error:", err.message);
        }

        let acceptedCount = 0;
        let rejectedCount = 0;

        for (let c = 0; c < generatedData.length; c++) {
          let q = generatedData[c];
          let status = 'KEEP';

          for (let j = 0; j < c; j++) {
            const prev = generatedData[j];
            const ansStr1 = q.options ? q.options[q.answer.charCodeAt(0) - 65] : "";
            const ansStr2 = prev.options ? prev.options[prev.answer.charCodeAt(0) - 65] : "";
            if (ansStr1 && ansStr2 && ansStr1.toLowerCase() === ansStr2.toLowerCase()) { status = 'REJECT'; break; }
            if (stringSimilarity(q.question, prev.question) > 0.65) { status = 'REJECT'; break; }
          }

          if (!q.options || q.options.length !== 4) status = 'REJECT';
          else if (q.question_purpose === 'VISUAL' && (!q.visual_evidence || !q.visible_feature)) status = 'REJECT';
          else {
            const promptStr = JSON.stringify(q).toLowerCase();
            if (promptStr.includes('camera') || promptStr.includes('composition')) status = 'REJECT';
          }

          q.site_id = item.site_id;
          q.image_id = item.image_id;
          q.review_status = status;

          if (status === 'KEEP') acceptedCount++;
          else rejectedCount++;

          allCandidates.push(q);
        }

        item.candidates_generated = generatedData.length;
        item.accepted = acceptedCount;
        item.rejected = rejectedCount;
        item.status = 'COMPLETE';
        item.error = null;
        item.retry_count = 0;

        fs.writeFileSync(ANNOTATIONS_FILE, JSON.stringify(allCandidates, null, 2));
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

      } catch (err) {
        if (err.message === 'QUOTA_EXHAUSTED') {
          item.status = 'FAILED_QUOTA';
          item.retry_count++;
          item.error = '429 Too Many Requests';
          console.error(`Quota exhausted on image ${item.image_id}. Marking batch failure and STOPPING.`);
          fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
          process.exit(0); // Clean stop
        } else {
          item.status = 'FAILED_OTHER';
          item.error = err.message;
          fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
        }
      }
    }
    
    console.log("Batch complete. Next batch must be triggered separately.");
  } catch (error) {
    console.error("Batch runner error:", error);
  } finally {
    if (dbConnection) await mongoose.disconnect();
  }
}

run();
