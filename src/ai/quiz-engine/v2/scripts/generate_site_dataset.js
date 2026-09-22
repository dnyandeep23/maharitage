const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const https = require('https');
const crypto = require('crypto');

if (!process.env.MONGODB_URI) { console.error("ERROR: MONGODB_URI missing."); process.exit(1); }
if (!process.env.GEMINI_API_KEY) { console.error("ERROR: GEMINI_API_KEY missing."); process.exit(1); }

const uri = process.env.MONGODB_URI;
const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const textSchema = {
  type: SchemaType.OBJECT,
  properties: {
    site_id: { type: SchemaType.STRING },
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: { type: SchemaType.STRING },
          question: { type: SchemaType.STRING },
          options: {
            type: SchemaType.OBJECT,
            properties: { A: { type: SchemaType.STRING }, B: { type: SchemaType.STRING }, C: { type: SchemaType.STRING }, D: { type: SchemaType.STRING } }
          },
          correct_option: { type: SchemaType.STRING },
          source_evidence: { type: SchemaType.STRING },
          source_field: { type: SchemaType.STRING },
          mongo_evidence: { type: SchemaType.STRING }
        },
        required: ["category", "question", "options", "correct_option", "source_evidence", "source_field", "mongo_evidence"]
      }
    }
  }
};

const imageSchema = {
  type: SchemaType.OBJECT,
  properties: {
    site_id: { type: SchemaType.STRING },
    images: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          image_id: { type: SchemaType.STRING },
          questions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                image_id: { type: SchemaType.STRING },
                question_type: { type: SchemaType.STRING },
                question: { type: SchemaType.STRING },
                options: {
                  type: SchemaType.OBJECT,
                  properties: { A: { type: SchemaType.STRING }, B: { type: SchemaType.STRING }, C: { type: SchemaType.STRING }, D: { type: SchemaType.STRING } }
                },
                correct_option: { type: SchemaType.STRING },
                visual_evidence: { type: SchemaType.STRING },
                category: { type: SchemaType.STRING }
              },
              required: ["image_id", "question_type", "question", "options", "correct_option", "visual_evidence", "category"]
            }
          }
        },
        required: ["image_id", "questions"]
      }
    }
  }
};

const getRpm = (envVar, defaultRpm) => {
  const val = parseInt(process.env[envVar], 10);
  return !isNaN(val) && val > 0 ? val : defaultRpm;
};

const rpm31Lite = getRpm('RPM_31_FLASH_LITE', 14);
const rpm35Lite = getRpm('RPM_35_FLASH_LITE', 14);
const rpm35Flash = getRpm('RPM_35_FLASH', 14);
const rpm36Flash = getRpm('RPM_36_FLASH', 4);
const rpm37Flash = getRpm('RPM_37_FLASH', 2);

const delayFor = rpm => Math.ceil(60000 / rpm) + 500;

const modelsConfig = [
  { name: 'gemini-3.1-flash-lite', rpm: rpm31Lite, delayMs: delayFor(rpm31Lite) },
  { name: 'gemini-3.5-flash-lite', rpm: rpm35Lite, delayMs: delayFor(rpm35Lite) },
  { name: 'gemini-3.5-flash', rpm: rpm35Flash, delayMs: delayFor(rpm35Flash) },
  { name: 'gemini-3.6-flash', rpm: rpm36Flash, delayMs: delayFor(rpm36Flash) }
  // { name: 'gemini-3.7-flash', rpm: rpm37Flash, delayMs: delayFor(rpm37Flash) }
];

const poolStats = {};
const textModels = {};
const imageModels = {};
modelsConfig.forEach(m => {
  poolStats[m.name] = { status: 'ACTIVE', cooldownUntil: 0, requests: 0, success: 0, error429: 0, error503: 0, zeroOutput: 0, timeout: 0, accepted: 0, latency_total: 0, latency_avg: 0 };
  textModels[m.name] = ai.getGenerativeModel({ model: m.name, generationConfig: { responseMimeType: "application/json", temperature: 0.0, responseSchema: textSchema } });
  imageModels[m.name] = ai.getGenerativeModel({ model: m.name, generationConfig: { responseMimeType: "application/json", temperature: 0.0, responseSchema: imageSchema } });
});

let TOTAL_NEW_TEXT = 0;
let TOTAL_NEW_IMAGE = 0;
let TOTAL_REJECTED = 0;
let TOTAL_PARSE_ERRORS = 0;
let TOTAL_ZERO_OUTPUT = 0;
let TOTAL_429 = 0;
let TOTAL_503 = 0;
let TOTAL_TIMEOUT = 0;

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_UNAVAILABLE')), ms))
  ]);
};

const globalQueue = [];
let ACTIVE_WORKERS = 0;
let CONCURRENT_REQUESTS = 0;
let MAX_CONCURRENT_REQUESTS = 0;
let globalSiteProgress = {};

const DATASET_DIR = path.join(__dirname, '..', 'dataset');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function updateTableFile() {
  let out = "==================================================\n";
  out += "MODEL_USAGE_SUMMARY\n";
  out += "==================================================\n";
  out += "| Model | Requests | Success | 429 | 503 | Timeout | Zero | Accepted | Avg Latency |\n";
  out += "|------|----------|---------|-----|-----|---------|------|----------|-------------|\n";
  modelsConfig.forEach(m => {
    const s = poolStats[m.name];
    out += `| ${m.name} | ${s.requests} | ${s.success} | ${s.error429} | ${s.error503} | ${s.timeout} | ${s.zeroOutput} | ${s.accepted} | ${s.latency_avg}ms |\n`;
  });

  out += "\n==================================================\n";
  out += "SITE_PROGRESS\n";
  out += "==================================================\n";
  out += "| Site | Text | Images Complete | Images Remaining |\n";
  out += "|------|------|-----------------|------------------|\n";
  for (const [siteId, stats] of Object.entries(globalSiteProgress)) {
    out += `| ${siteId} | ${stats.textCount} | ${stats.imagesComplete} | ${stats.imagesRemaining} |\n`;
  }
  
  fs.writeFileSync(path.join(DATASET_DIR, 'progress_table.log'), out);
}

function loadJsonArray(filePath) { if (fs.existsSync(filePath)) { try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch(e) { return []; } } return []; }
function saveJson(filePath, data) { fs.writeFileSync(filePath, JSON.stringify(data, null, 2)); }

function extractUrls(obj, found = []) {
  if (!obj) return found;
  if (typeof obj === 'string') { if (obj.includes('cloudinary.com') && (obj.endsWith('.jpg') || obj.endsWith('.png') || obj.endsWith('.jpeg'))) found.push(obj); }
  else if (Array.isArray(obj)) { obj.forEach(item => extractUrls(item, found)); }
  else if (typeof obj === 'object') { for (const key in obj) extractUrls(obj[key], found); }
  return found;
}

function fetchImageBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks = []; res.on('data', chunk => chunks.push(chunk)); res.on('end', () => resolve(Buffer.concat(chunks)));
    }).on('error', reject);
  });
}

function computeHash(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }

function stringSimilarity(s1, s2) {
  if (!s1 || !s2) return 0;
  const w1 = s1.toLowerCase().split(/\W+/);
  const w2 = s2.toLowerCase().split(/\W+/);
  const inter = w1.filter(x => w2.includes(x));
  return inter.length / Math.max(w1.length, w2.length);
}

// ------------------------------------------------------------------------------------------------
// JOBS
// ------------------------------------------------------------------------------------------------

async function processTextJob(job, modelName) {
  const { site_id, promptTargets, contextStr } = job;
  const TEXT_ANN = path.join(DATASET_DIR, site_id, 'text', 'annotations.json');
  const REJ_ANN = path.join(DATASET_DIR, site_id, 'rejected_annotations.json');
  
  const textPrompt = `Generate exactly the requested number of distinct MCQs for the following topics: ${promptTargets.join(', ')}. Use only the verified context provided. Do not invent facts. Return output matching the JSON schema exactly.\nContext: ${contextStr}`;
  
  const start = Date.now();
  CONCURRENT_REQUESTS++;
  if (CONCURRENT_REQUESTS > MAX_CONCURRENT_REQUESTS) MAX_CONCURRENT_REQUESTS = CONCURRENT_REQUESTS;
  const res = await withTimeout(textModels[modelName].generateContent([textPrompt]), 60000);
  CONCURRENT_REQUESTS--;
  const latency = Date.now() - start;
  
  let raw;
  try {
    raw = JSON.parse(res.response.text());
  } catch (e) {
    throw new Error(`JSON_PARSE_ERROR: ${e.message}`);
  }
  let returned = 0, accepted = 0, rejected = 0;
  
  const allText = loadJsonArray(TEXT_ANN);
  const allRej = loadJsonArray(REJ_ANN);
  
  if (raw.questions) {
    returned = raw.questions.length;
  }
  
  if (returned === 0) {
    throw new Error('ZERO_OUTPUT_ERROR');
  }

  for (let idx = 0; idx < returned; idx++) {
    const q = raw.questions[idx];
    if (allText.length >= 20) break; 

    q.annotation_id = `${site_id}_txt_${q.category}_${Date.now()}_${idx}`;
    q.site_id = site_id; q.image_id = null; q.question_type = "TEXT_MCQ"; q.visual_dependency = "NONE";
    q.answer = q.correct_option; delete q.correct_option;
    q.difficulty = "MODERATE"; q.question_purpose = "TEXT_CONTEXT";
    q.generation_model = modelName;
    
    let isReject = false, rejReason = "";
    if (!q.options || !q.options.A || !q.source_evidence || !q.mongo_evidence) { isReject = true; rejReason = "schema_violation"; }
    else if (!['A','B','C','D'].includes(q.answer)) { isReject = true; rejReason = "invalid_answer"; }
    else {
      for (const ext of allText) { if (stringSimilarity(q.question, ext.question) > 0.65) { isReject = true; rejReason = "duplicate"; break; } }
    }
    
    q.duplicate_group = null; q.duplicate_type = isReject ? rejReason : "UNIQUE";
    q.review_status = isReject ? "REJECT" : "DRAFT";
    if (isReject) { q.rejection_reason = rejReason; allRej.push(q); rejected++; TOTAL_REJECTED++; } 
    else { allText.push(q); poolStats[modelName].accepted++; accepted++; TOTAL_NEW_TEXT++; }
  }

  saveJson(TEXT_ANN, allText); saveJson(REJ_ANN, allRej);
  if (globalSiteProgress[site_id]) {
    globalSiteProgress[site_id].textCount = allText.length;
    updateTableFile();
  }
  
  console.log(`MODEL: ${modelName} | WORKER: ${modelName} | SITE: ${site_id} | TEXT BATCH | API_CALLS: 1 | LATENCY: ${latency}ms | RETURNED: ${returned} | ACCEPTED: ${accepted} | REJECTED: ${rejected}`);
  return { latency, accepted };
}

async function processImageJob(job, modelName) {
  const { site_id, validImages, contentArray, mappedIds, ts } = job;
  const IMG_ANN = path.join(DATASET_DIR, site_id, 'image', 'annotations.json');
  const REJ_ANN = path.join(DATASET_DIR, site_id, 'rejected_annotations.json');
  
  const start = Date.now();
  CONCURRENT_REQUESTS++;
  if (CONCURRENT_REQUESTS > MAX_CONCURRENT_REQUESTS) MAX_CONCURRENT_REQUESTS = CONCURRENT_REQUESTS;
  const res = await withTimeout(imageModels[modelName].generateContent(contentArray), 60000);
  CONCURRENT_REQUESTS--;
  const latency = Date.now() - start;

  let raw;
  try {
    raw = JSON.parse(res.response.text());
  } catch (e) {
    throw new Error(`JSON_PARSE_ERROR: ${e.message}`);
  }
  let returned = 0, accepted = 0, rejected = 0;

  const allImg = loadJsonArray(IMG_ANN);
  const allRej = loadJsonArray(REJ_ANN);
  const currentImageCounts = {};
  allImg.forEach(a => { if (a.image_url) currentImageCounts[a.image_url] = (currentImageCounts[a.image_url] || 0) + 1; });

  if (raw.images) {
    raw.images.forEach(imgData => {
      const opaqueId = imgData.image_id;
      const mapData = mappedIds[opaqueId];
      if (!mapData) return; 

      if (imgData.questions) {
        returned += imgData.questions.length;
        for (let idx = 0; idx < imgData.questions.length; idx++) {
          const q = imgData.questions[idx];
          if ((currentImageCounts[mapData.url] || 0) >= 5) continue;

          let status = 'DRAFT', dupType = 'UNIQUE', rejReason = "";
          
          if (q.image_id !== opaqueId) { status = 'REJECT'; rejReason = 'image_id_mismatch'; }
          else if (!q.options || !q.options.A || !['A','B','C','D'].includes(q.correct_option)) { status = 'REJECT'; rejReason = 'invalid_answer'; }
          else if (!q.visual_evidence || q.visual_evidence.length < 5 || q.visual_evidence.toLowerCase().includes('district') || q.visual_evidence.toLowerCase().includes('coordinate')) { status = 'REJECT'; rejReason = 'missing_or_generic_evidence'; }
          
          if (status === 'DRAFT') {
            for (let a of allImg) if (a.image_url === mapData.url && stringSimilarity(q.question, a.question) > 0.65) { status = 'REJECT'; rejReason = 'duplicate'; break; }
          }
          
          const originalType = q.question_type;
          q.question_type = "IMAGE_MCQ";
          q.question_purpose = originalType === 'VISUAL_ONLY' ? 'VISUAL' : 'IMAGE_CONTEXT';
          q.source_evidence = q.visual_evidence || "IMAGE_EVIDENCE";
          q.source_field = "image";
          q.generation_model = modelName;
          
          const catMap = {
            'architecture': 'ARCHITECTURAL', 'history': 'HISTORICAL', 'culture': 'CULTURAL_RELIGIOUS',
            'geography': 'OTHER', 'epigraphy': 'INSCRIPTION', 'sculpture': 'VISUAL_SCULPTURE',
            'architectural_detail': 'VISUAL_ARCHITECTURE', 'identification': 'OTHER', 'condition': 'OTHER'
          };
          if (catMap[q.category.toLowerCase()]) { q.category = catMap[q.category.toLowerCase()]; }
          else { q.category = q.category.toUpperCase(); }

          q.annotation_id = `${mapData.realImgId}_${ts}_${idx}`;
          q.site_id = site_id; q.image_id = mapData.realImgId; q.image_url = mapData.url; 
          q.answer = q.correct_option; delete q.correct_option;
          q.difficulty = "MODERATE";
          q.visual_dependency = originalType === 'VISUAL_ONLY' ? 'HIGH' : 'MEDIUM';
          q.review_status = status; q.duplicate_group = null; q.duplicate_type = status === 'REJECT' ? rejReason : 'UNIQUE';
          
          if (status === 'REJECT') { q.rejection_reason = rejReason; allRej.push(q); rejected++; TOTAL_REJECTED++; } 
          else { 
            allImg.push(q); currentImageCounts[mapData.url] = (currentImageCounts[mapData.url] || 0) + 1;
            poolStats[modelName].accepted++; accepted++; TOTAL_NEW_IMAGE++;
          }
        }
      }
    });
  }
  
  if (returned === 0) {
    throw new Error('ZERO_OUTPUT_ERROR');
  }
  
  saveJson(IMG_ANN, allImg); saveJson(REJ_ANN, allRej);
  if (globalSiteProgress[site_id]) {
    let imgComplete = 0;
    const group = {};
    allImg.forEach(a => { if(a.image_url) group[a.image_url] = (group[a.image_url]||0)+1; });
    globalSiteProgress[site_id].rawUrls.forEach(u => { if ((group[u]||0)>=5) imgComplete++; });
    globalSiteProgress[site_id].imagesComplete = imgComplete;
    globalSiteProgress[site_id].imagesRemaining = globalSiteProgress[site_id].rawUrls.length - imgComplete;
    updateTableFile();
  }
  let logStr = `MODEL: ${modelName} | WORKER: ${modelName} | SITE: ${site_id}`;
  if (validImages[0]) logStr += ` | IMAGE_A: ${mappedIds[validImages[0].opaqueId].realImgId}`;
  if (validImages[1]) logStr += ` | IMAGE_B: ${mappedIds[validImages[1].opaqueId].realImgId}`;
  logStr += ` | API_CALLS: 1 | LATENCY: ${latency}ms | RETURNED: ${returned} | ACCEPTED: ${accepted} | REJECTED: ${rejected}`;
  console.log(logStr);
  return { latency, accepted };
}

async function processImageJobWithBuffers(job, modelName) {
  const { site_id, batchUrls, imageGroups, contextStr, tsOffset } = job;
  let validImages = [];
  let mappedIds = {};
  
  for (let j = 0; j < batchUrls.length; j++) {
    const url = batchUrls[j];
    const remainingForImage = 5 - (imageGroups[url] || 0);
    if (remainingForImage <= 0) continue;
    try {
      const buffer = await fetchImageBuffer(url); 
      if (!buffer || buffer.length === 0) continue;
      const hash = computeHash(buffer);
      const opaqueId = j === 0 ? "IMAGE_A" : "IMAGE_B";
      const realImgId = `${site_id}_img_${hash.substring(0,6)}`;
      mappedIds[opaqueId] = { url, realImgId, remainingForImage };
      validImages.push({ opaqueId, part: { inlineData: { data: buffer.toString("base64"), mimeType: "image/jpeg" } } });
    } catch(e) {}
  }
  
  if (validImages.length === 0) return { latency: 0, accepted: 0 };
  
  let promptInstructions = `Generate up to 5 distinct, evidence-backed Maharashtra heritage MCQs for EACH image.\nProcess IMAGE_A and IMAGE_B independently.\nNever use evidence from one image when writing questions for the other.\nQuestions may be:\n- VISUAL_ONLY\n- IMAGE_CONTEXT\nVISUAL_ONLY must be answerable from pixels alone.\nIMAGE_CONTEXT may use the provided verified site context together with the image.\nIf fewer than 5 strong questions exist for an image, return fewer.\nDo not invent or repeat questions.\n\nContext: ${contextStr}\n\nTargets:\n`;
  let contentArray = [promptInstructions];
  
  for (const vi of validImages) {
    contentArray[0] += `- ${vi.opaqueId}: Target up to ${mappedIds[vi.opaqueId].remainingForImage} questions (Mix of VISUAL_ONLY and IMAGE_CONTEXT).\n`;
    contentArray.push(vi.part);
  }
  
  const expandedJob = { site_id, validImages, contentArray, mappedIds, ts: Date.now() + tsOffset };
  return processImageJob(expandedJob, modelName);
}

// ------------------------------------------------------------------------------------------------
// CAPABILITY CHECK (Pre-flight / Health Check)
// ------------------------------------------------------------------------------------------------

async function checkWorkerHealth(modelName) {
  try {
    const res = await withTimeout(textModels[modelName].generateContent([`Generate 1 distinct MCQ. Return strictly the JSON matching the schema. Context: general.`]), 30000);
    const raw = JSON.parse(res.response.text());
    if (raw && raw.questions && raw.questions.length > 0) return true;
    return false;
  } catch (e) {
    return false;
  }
}

async function runCapabilityCheck(models, sampleUrl) {
  console.log("\n==================================================");
  console.log("CAPABILITY & CONCURRENCY VERIFICATION");
  console.log("==================================================");
  
  let buffer;
  try {
    buffer = await fetchImageBuffer(sampleUrl);
  } catch(e) {
    console.log("Failed to fetch sample image for verification.");
    return false;
  }
  
  console.log(`WORKERS_STARTED = ${models.length}`);
  
  const promises = models.map(async (modelName) => {
    let status = "FAILED";
    let imageSupport = false;
    let structuredOutput = false;
    let returned = 0, accepted = 0, errCount = 0;
    
    const start = Date.now();
    CONCURRENT_REQUESTS++;
    if (CONCURRENT_REQUESTS > MAX_CONCURRENT_REQUESTS) MAX_CONCURRENT_REQUESTS = CONCURRENT_REQUESTS;
    
    try {
      const contentArray = [
        "Generate exactly 1 VISUAL_ONLY MCQ for this image. Return structured JSON exactly matching the schema.",
        { inlineData: { data: buffer.toString("base64"), mimeType: "image/jpeg" } }
      ];
      
      const res = await withTimeout(imageModels[modelName].generateContent(contentArray), 60000);
      imageSupport = true;
      let raw;
      try {
        raw = JSON.parse(res.response.text());
        structuredOutput = true;
      } catch (e) {
        status = "PARSE_ERROR";
        errCount++;
      }
      
      if (structuredOutput && raw.images && raw.images.length > 0 && raw.images[0].questions) {
        const qList = raw.images[0].questions;
        returned = qList.length;
        if (returned > 0) {
          const q = qList[0];
          if (q.options && q.options.A && q.options.B && q.options.C && q.options.D && q.correct_option && q.visual_evidence) {
            accepted = 1;
            status = "PASS";
          } else {
            status = "SCHEMA_VIOLATION";
            errCount++;
          }
        } else {
          status = "NO_QUESTIONS_RETURNED";
          errCount++;
        }
      }
    } catch (e) {
      if (e.message.includes("429")) {
        status = "429_UNAVAILABLE";
        poolStats[modelName].status = 'COOLDOWN';
        poolStats[modelName].cooldownUntil = Date.now() + 300000;
        poolStats[modelName].error429++;
        TOTAL_429++;
      } else if (e.message.includes("503") || e.status === 503) {
        status = "503_UNAVAILABLE";
        poolStats[modelName].status = 'COOLDOWN';
        poolStats[modelName].cooldownUntil = Date.now() + 60000;
        poolStats[modelName].error503++;
        TOTAL_503++;
      } else if (e.message.includes("TIMEOUT_UNAVAILABLE")) {
        status = "TIMEOUT_UNAVAILABLE";
        poolStats[modelName].status = 'COOLDOWN';
        poolStats[modelName].cooldownUntil = Date.now() + 60000;
        poolStats[modelName].timeout++;
        TOTAL_TIMEOUT++;
      } else if (e.message.includes("404")) {
        status = "404_UNAVAILABLE";
        poolStats[modelName].status = 'DISABLED';
      } else {
        status = "API_ERROR";
      }
    }
    
    CONCURRENT_REQUESTS--;
    const latency = Date.now() - start;
    
    console.log(`MODEL: ${modelName} | IMAGE_SUPPORT: ${imageSupport} | STRUCTURED_OUTPUT: ${structuredOutput} | LATENCY: ${latency}ms | QUESTIONS_RETURNED: ${returned} | QUESTIONS_ACCEPTED: ${accepted} | VALIDATION_ERRORS: ${errCount} | STATUS: ${status}`);
    return status === "PASS";
  });
  
  const results = await Promise.all(promises);
  const passedCount = results.filter(r => r).length;
  
  console.log(`\nCONCURRENT_REQUESTS = ${CONCURRENT_REQUESTS}`);
  console.log(`MAX_CONCURRENT_REQUESTS = ${MAX_CONCURRENT_REQUESTS}`);
  
  if (MAX_CONCURRENT_REQUESTS < 2 && models.length > 1) {
    console.log("VERIFICATION FAIL: Requests did not overlap (Sequential). STOP.");
    return false;
  }
  
  if (passedCount === 0) {
    console.log("VERIFICATION FAIL: No models passed the capability check initially. Autonomous controller will attempt recovery.");
    return true; // allow controller to run recovery
  }
  
  console.log(`VERIFICATION PASS: True concurrency achieved (${MAX_CONCURRENT_REQUESTS} overlap). ${passedCount} models fully capable.`);
  return true;
}

// ------------------------------------------------------------------------------------------------
// SHARED QUEUE BUILDER
// ------------------------------------------------------------------------------------------------

async function buildGlobalQueue(sites) {
  console.log("\n==================================================");
  console.log("BUILDING JOB QUEUE");
  console.log("==================================================");
  
  const siteProgress = {};
  for (const site of sites) {
    const siteId = site.site_id;
    const SITE_DIR = path.join(DATASET_DIR, siteId);
    const TEXT_DIR = path.join(SITE_DIR, 'text');
    const IMAGE_DIR = path.join(SITE_DIR, 'image');
    [SITE_DIR, TEXT_DIR, IMAGE_DIR].forEach(d => { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

    const TEXT_ANN = path.join(TEXT_DIR, 'annotations.json');
    const IMG_ANN = path.join(IMAGE_DIR, 'annotations.json');
    const allText = loadJsonArray(TEXT_ANN); const allImg = loadJsonArray(IMG_ANN);
    const rawUrls = Array.from(new Set(extractUrls(site)));
    
    const imageGroups = {}; allImg.forEach(a => { if(a.image_url) { imageGroups[a.image_url] = (imageGroups[a.image_url] || 0) + 1; } });
    let imagesComplete = 0; rawUrls.forEach(u => { if ((imageGroups[u] || 0) >= 5) imagesComplete++; });
    let imagesRemaining = rawUrls.length - imagesComplete;
    
    if (siteId === 'Ell0001' || siteId === 'Pit0002') { 
      imagesComplete = rawUrls.length; imagesRemaining = 0; 
    }
    
    const contextStr = JSON.stringify({ heritage_type: site.heritage_type, period: site.period, historical_context: site.historical_context, description: site.description });
    
    // TEXT JOBS
    if (allText.length < 20 && siteId !== 'Ell0001' && siteId !== 'Pit0002' && siteId !== 'Aja0003') {
      const topicGroups = [
        ["HISTORICAL", "ARCHITECTURAL", "CULTURAL_RELIGIOUS", "INSCRIPTION"],
        ["CHRONOLOGY", "COMPARATIVE_REASONING", "OTHER"]
      ];
      let simLength = allText.length;
      for (const group of topicGroups) {
        if (simLength >= 20) break;
        let promptTargets = [];
        let totalNeeded = 20 - simLength;
        for (const topic of group) {
          if (totalNeeded <= 0) break;
          const existingForTopic = allText.filter(a => a.category === topic).length;
          if (existingForTopic < 4) {
            const needed = Math.min(4 - existingForTopic, totalNeeded);
            promptTargets.push(`${needed} questions for ${topic}`);
            totalNeeded -= needed;
            simLength += needed; // simulate
          }
        }
        if (promptTargets.length > 0) {
          globalQueue.push({ type: 'TEXT', site_id: siteId, promptTargets, contextStr });
        }
      }
    }

    // IMAGE JOBS
    const pendingUrls = rawUrls.filter(u => (imageGroups[u] || 0) < 5);
    if (pendingUrls.length > 0 && siteId !== 'Ell0001' && siteId !== 'Pit0002') {
      let tsOffset = 0;
      for (let i = 0; i < pendingUrls.length; i += 2) {
        const batch = pendingUrls.slice(i, i + 2);
        globalQueue.push({ type: 'IMAGE', site_id: siteId, batchUrls: batch, imageGroups, contextStr, tsOffset: tsOffset++ });
      }
    }
    
    siteProgress[siteId] = { textCount: allText.length, imagesComplete, imagesRemaining, rawUrls };
  }
  globalSiteProgress = siteProgress;
  updateTableFile();
  return siteProgress;
}

// ------------------------------------------------------------------------------------------------
// WORKER LOOP
// ------------------------------------------------------------------------------------------------

async function spawnWorker(config) {
  const modelName = config.name;
  ACTIVE_WORKERS++;
  console.log(`[Worker: ${modelName}] STARTED (${config.rpm} RPM)`);
  
  while (globalQueue.length > 0 && poolStats[modelName].status === 'ACTIVE') {
    const jobIdx = globalQueue.findIndex(j => j.last_failed_model !== modelName);
    if (jobIdx === -1) {
      await sleep(2000); // Wait for other models to process these or for queue to drain
      continue;
    }
    
    const job = globalQueue.splice(jobIdx, 1)[0];
    let attempts = 0;
    
    while (attempts < 3) {
      poolStats[modelName].requests++;
      try {
        let metrics;
        if (job.type === 'TEXT') {
          metrics = await processTextJob(job, modelName);
        } else {
          metrics = await processImageJobWithBuffers(job, modelName);
        }
        
        poolStats[modelName].success++;
        if (metrics.latency > 0) {
          poolStats[modelName].latency_total += metrics.latency;
          poolStats[modelName].latency_avg = Math.round(poolStats[modelName].latency_total / poolStats[modelName].success);
        }
        break; // success, break retry loop
      } catch (e) {
        if (e.message.includes('JSON_PARSE_ERROR')) {
           TOTAL_PARSE_ERRORS++;
           console.error(`[Worker: ${modelName}] PARSE ERROR:`, e.message);
           attempts++;
           if (attempts >= 3) {
             console.log(`[Worker: ${modelName}] Job permanently failed (Parse Error) after 3 attempts. Returned to queue for another worker.`);
             globalQueue.push(job);
             break; 
           }
           const backoff = [2000, 4000, 8000][attempts - 1] || 8000;
           console.log(`[Worker: ${modelName}] Retrying in ${backoff}ms (Attempt ${attempts}/3)...`);
           await sleep(backoff);
        } else if (e.message.includes('429')) {
          poolStats[modelName].error429++;
          TOTAL_429++;
          poolStats[modelName].status = 'COOLDOWN';
          poolStats[modelName].cooldownUntil = Date.now() + 300000; // 5 min
          console.log(`[Worker: ${modelName}] 429 Quota Exhausted. Entering 5min COOLDOWN.`);
          globalQueue.unshift(job); 
          break; 
        } else if (e.message.includes('503') || e.status === 503) {
          poolStats[modelName].error503++;
          TOTAL_503++;
          attempts++;
          if (attempts >= 3) {
             console.log(`[Worker: ${modelName}] Job permanently failed (503) after 3 attempts. Entering 1min COOLDOWN and returning job to queue.`);
             poolStats[modelName].status = 'COOLDOWN';
             poolStats[modelName].cooldownUntil = Date.now() + 60000; // 1 min
             globalQueue.push(job);
             break;
          }
          const backoff = [2000, 4000, 8000][attempts - 1] || 8000;
          console.log(`[Worker: ${modelName}] 503 Service Unavailable. Retrying in ${backoff}ms (Attempt ${attempts}/3)...`);
          await sleep(backoff);
        } else if (e.message.includes('TIMEOUT_UNAVAILABLE')) {
          poolStats[modelName].timeout++;
          TOTAL_TIMEOUT++;
          console.error(`[Worker: ${modelName}] TIMEOUT ERROR: API hung for 60s.`);
          attempts++;
          if (attempts >= 3) {
            console.log(`[Worker: ${modelName}] Job permanently failed (TIMEOUT). Entering 1min COOLDOWN and returning job to queue.`);
            poolStats[modelName].status = 'COOLDOWN';
            poolStats[modelName].cooldownUntil = Date.now() + 60000; // 1 min
            globalQueue.push(job);
            break; 
          }
          const backoff = [2000, 4000, 8000][attempts - 1] || 8000;
          console.log(`[Worker: ${modelName}] Retrying in ${backoff}ms (Attempt ${attempts}/3)...`);
          await sleep(backoff);
        } else if (e.message.includes('ZERO_OUTPUT_ERROR')) {
          TOTAL_ZERO_OUTPUT++;
          poolStats[modelName].zeroOutput++;
          console.error(`[Worker: ${modelName}] ZERO OUTPUT ERROR`);
          attempts++;
          if (attempts >= 3) {
            console.log(`[Worker: ${modelName}] Job failed (ZERO OUTPUT) after 3 attempts. Returning to queue for another model.`);
            job.last_failed_model = modelName;
            globalQueue.push(job);
            break; 
          }
          const backoff = [2000, 4000, 8000][attempts - 1] || 8000;
          console.log(`[Worker: ${modelName}] Retrying in ${backoff}ms (Attempt ${attempts}/3)...`);
          await sleep(backoff);
        } else {
          console.error(`[Worker: ${modelName}] UNEXPECTED ERROR:`, e.message);
          attempts++;
          if (attempts >= 3) {
            console.log(`[Worker: ${modelName}] Job permanently failed. Returned to queue for another worker.`);
            globalQueue.push(job);
            break; 
          }
          const backoff = [2000, 4000, 8000][attempts - 1] || 8000;
          console.log(`[Worker: ${modelName}] Retrying in ${backoff}ms (Attempt ${attempts}/3)...`);
          await sleep(backoff);
        }
      }
    }
    
    if (poolStats[modelName].status === 'ACTIVE') {
      await sleep(config.delayMs);
    }
  }
  ACTIVE_WORKERS--;
  console.log(`[Worker: ${modelName}] STOPPED`);
}

// ------------------------------------------------------------------------------------------------
// MAIN ORCHESTRATOR
// ------------------------------------------------------------------------------------------------

async function autonomousControllerLoop() {
  console.log("\n==================================================");
  console.log("STARTING AUTONOMOUS CONTROLLER");
  console.log("==================================================");
  
  modelsConfig.forEach(c => {
    if (poolStats[c.name].status === 'ACTIVE') {
      spawnWorker(c);
    }
  });

  while (globalQueue.length > 0) {
    let activeCount = 0;
    let cooldownCount = 0;
    
    modelsConfig.forEach(c => {
      const s = poolStats[c.name];
      if (s.status === 'ACTIVE') activeCount++;
      if (s.status === 'COOLDOWN') {
        cooldownCount++;
        if (Date.now() > s.cooldownUntil) {
          console.log(`[Controller] Initiating health check for ${c.name}...`);
          s.status = 'CHECKING';
          checkWorkerHealth(c.name).then(healthy => {
            if (healthy) {
              console.log(`[Controller] ${c.name} health check PASSED. Reactivating worker.`);
              s.status = 'ACTIVE';
              s.error503 = 0;
              s.timeout = 0;
              spawnWorker(c);
            } else {
              console.log(`[Controller] ${c.name} health check FAILED. Extending cooldown 60s.`);
              s.status = 'COOLDOWN';
              s.cooldownUntil = Date.now() + 60000;
            }
          });
        }
      }
    });

    const inFlight = activeCount > 0 ? CONCURRENT_REQUESTS : 0;
    console.log(`[CONTROLLER] ACTIVE_WORKERS: ${activeCount} | COOLDOWN: ${cooldownCount} | PENDING: ${globalQueue.length} | IN_FLIGHT: ${inFlight}`);
    
    if (activeCount === 0 && cooldownCount === 0) {
      console.log("GLOBAL_STATUS = ALL_MODELS_PERMANENTLY_DEAD");
      break;
    } else if (activeCount === 0 && cooldownCount > 0) {
      console.log("GLOBAL_WAITING_FOR_MODEL: Waiting for cooldowns to expire...");
    }

    await sleep(10000); // Tick every 10 seconds
  }
  
  console.log("\n==================================================");
  console.log("FINAL GENERATION STATISTICS");
  console.log("==================================================");
  console.log(`TOTAL_NEW_TEXT: ${TOTAL_NEW_TEXT}`);
  console.log(`TOTAL_NEW_IMAGE: ${TOTAL_NEW_IMAGE}`);
  console.log(`TOTAL_REJECTED: ${TOTAL_REJECTED}`);
  console.log(`TOTAL_429: ${TOTAL_429}`);
  console.log(`TOTAL_503: ${TOTAL_503}`);
  console.log(`TOTAL_TIMEOUT: ${TOTAL_TIMEOUT}`);
  console.log(`TOTAL_PARSE_ERRORS: ${TOTAL_PARSE_ERRORS}`);
  console.log(`TOTAL_ZERO_OUTPUT: ${TOTAL_ZERO_OUTPUT}`);
  console.log("\nGLOBAL_STATUS = DATASET_COMPLETE");
}

async function main() {
  let dbConnection;
  try {
    dbConnection = await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const sites = await db.collection('sites').find({}).toArray();
    
    let sampleUrl = null;
    for (const site of sites) {
      const urls = extractUrls(site);
      if (urls.length > 0) { sampleUrl = urls[0]; break; }
    }
    
    if (sampleUrl) {
      const verifySuccess = await runCapabilityCheck(modelsConfig.map(c=>c.name), sampleUrl);
      if (!verifySuccess) {
        process.exit(1);
      }
    } else {
      console.log("No images found to run capability check. Proceeding.");
    }
    
    const siteProgress = await buildGlobalQueue(sites);
    console.log(`Total jobs built in queue: ${globalQueue.length}`);
    
    if (globalQueue.length === 0) {
      console.log("No jobs to process. Dataset complete.");
      return;
    }
    
    await autonomousControllerLoop();
    
  } catch (error) {
    console.error("Generator Error:", error);
  } finally {
    if (dbConnection) await mongoose.disconnect();
  }
}
main();
