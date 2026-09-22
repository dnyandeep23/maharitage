import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongoose';
import Site from '../../../models/Site';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// Safe string converter for MongoDB objects
function toSafe(val, fallback = "") {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) return val.map(v => toSafe(v)).filter(Boolean).join(", ") || fallback;
  if (typeof val === "object") {
    if (Array.isArray(val.curated_by)) return val.curated_by.join(", ");
    return Object.values(val).map(v => typeof v === "object" ? "" : String(v)).filter(Boolean).join(", ") || fallback;
  }
  return String(val);
}

// Clean template artifacts like "variant #1", "feature #2", "#3"
function cleanHeritageText(str) {
  if (typeof str !== "string") return str;
  return str
    .replace(/\s*variant\s*#\d+/gi, "")
    .replace(/\s*feature\s*#\d+/gi, "")
    .replace(/\s*#\d+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Helper to fetch dynamic questions from benchmark & annotation registries
function fetchQuestions({ siteId, questionType = "all", count = 5 }) {
  const processCwd = process.cwd();
  const allItems = [];

  // 1. Load canonical V4 gold benchmark (Visual Image Questions)
  const v4Path = path.join(processCwd, 'src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/questions/v4_gallery_gold.json');
  if (fs.existsSync(v4Path)) {
    try {
      const v4Items = JSON.parse(fs.readFileSync(v4Path, 'utf8'));
      for (const item of v4Items) {
        allItems.push({
          id: item.benchmark_id || item.question_id,
          questionId: item.benchmark_id || item.question_id,
          siteId: item.site_id || "v4_gold",
          type: "image",
          question: cleanHeritageText(item.question),
          options: Array.isArray(item.options) ? item.options.map(cleanHeritageText) : [],
          imageUrl: item.image_url || item.url || null
        });
      }
    } catch (e) {
      console.error("Error reading V4 benchmark in quiz engine:", e);
    }
  }

  // 2. Load questions from annotations directories
  const annBaseDir = path.join(processCwd, 'src/ai/quiz-engine/data/annotations');
  const searchDirs = [
    { dir: path.join(annBaseDir, 'text'), type: "text" },
    { dir: path.join(annBaseDir, 'visual/image'), type: "image" },
    { dir: path.join(annBaseDir, 'visual/inscription'), type: "image" },
    { dir: path.join(processCwd, 'src/ai/quiz-engine/v1/training/annotations'), type: "image" }
  ];

  for (const { dir, type } of searchDirs) {
    if (fs.existsSync(dir)) {
      try {
        const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
        for (const file of files) {
          const fileSiteId = file.replace('.json', '');
          const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
          const annList = Array.isArray(content) ? content : [content];
          for (const item of annList) {
            const qId = item.annotation_id || item.benchmark_id || `${fileSiteId}_${type}_${allItems.length + 1}`;
            allItems.push({
              id: qId,
              questionId: qId,
              siteId: item.site_id || fileSiteId,
              type: type,
              question: cleanHeritageText(item.question),
              options: Array.isArray(item.options) ? item.options.map(cleanHeritageText) : [],
              imageUrl: item.image_url || null
            });
          }
        }
      } catch (e) {
        // Skip malformed
      }
    }
  }

  // Filter items
  let filtered = allItems;

  if (siteId) {
    const cleanSite = siteId.toLowerCase();
    filtered = filtered.filter(item => 
      (item.siteId && item.siteId.toLowerCase().includes(cleanSite)) ||
      (item.questionId && item.questionId.toLowerCase().includes(cleanSite))
    );
  }

  if (questionType && questionType !== "all") {
    const cleanType = questionType.toLowerCase();
    filtered = filtered.filter(item => item.type === cleanType);
  }

  // Deduplicate by questionId
  const uniqueMap = new Map();
  for (const q of filtered) {
    if (!uniqueMap.has(q.questionId)) {
      uniqueMap.set(q.questionId, q);
    }
  }
  const result = Array.from(uniqueMap.values());

  const limit = Math.max(1, parseInt(count, 10) || 5);
  return result.slice(0, limit);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const siteId = searchParams.get('site_id') || searchParams.get('siteId');
    const questionType = searchParams.get('type') || searchParams.get('questionType') || searchParams.get('mode') || "all";
    const count = searchParams.get('count') || searchParams.get('limit') || 5;

    await connectDB();

    // Fetch dynamic questions per request criteria
    if (action === 'get_questions' || action === 'questions' || searchParams.has('type') || searchParams.has('site_id')) {
      const questions = fetchQuestions({ siteId, questionType, count });
      return NextResponse.json({
        success: true,
        count: questions.length,
        filter: { siteId: siteId || null, questionType, requestedCount: count },
        questions
      });
    }

    // List all sites
    if (action === 'list_sites') {
      const sites = await Site.find().lean();
      const siteList = (sites || []).map(s => ({
        site_id: toSafe(s.site_id, s._id?.toString()),
        site_name: toSafe(s.site_name, 'Heritage Site'),
        district: toSafe(s.location?.district, 'Maharashtra'),
        heritage_type: toSafe(s.heritage_type || s.h_type, 'Heritage Site')
      }));
      return NextResponse.json({ success: true, count: siteList.length, sites: siteList });
    }

    // Load saved annotations for a site
    if (action === 'get_annotations' && siteId) {
      const basePath = path.resolve(process.cwd(), 'src/ai/quiz-engine/data/annotations');
      const textPath = path.join(basePath, 'text', `${siteId}.json`);
      const imagePath = path.join(basePath, 'visual/image', `${siteId}.json`);
      const inscriptionPath = path.join(basePath, 'visual/inscription', `${siteId}.json`);

      const textAnns = fs.existsSync(textPath) ? JSON.parse(fs.readFileSync(textPath, 'utf8')) : [];
      const imageAnns = fs.existsSync(imagePath) ? JSON.parse(fs.readFileSync(imagePath, 'utf8')) : [];
      const inscAnns = fs.existsSync(inscriptionPath) ? JSON.parse(fs.readFileSync(inscriptionPath, 'utf8')) : [];

      return NextResponse.json({
        success: true,
        site_id: siteId,
        stats: {
          text: { count: textAnns.length },
          image: { count: imageAnns.length },
          inscription: { count: inscAnns.length },
          total: textAnns.length + imageAnns.length + inscAnns.length
        },
        annotations: [...textAnns, ...imageAnns, ...inscAnns]
      });
    }

    // Default: Return ready status and default questions list
    const questions = fetchQuestions({ siteId, questionType, count });
    return NextResponse.json({
      success: true,
      architecture: "NEW V1 Unified Engine",
      status: "Quiz Engine ready.",
      questions_count: questions.length,
      questions
    });

  } catch (error) {
    console.error("Quiz Engine API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, siteId, site_id, questionType, type, count, limit } = body || {};
    
    const targetSite = siteId || site_id;
    const targetType = questionType || type || "all";
    const targetCount = count || limit || 5;

    const questions = fetchQuestions({ siteId: targetSite, questionType: targetType, count: targetCount });
    return NextResponse.json({
      success: true,
      count: questions.length,
      filter: { siteId: targetSite || null, questionType: targetType, requestedCount: targetCount },
      questions
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to process POST request"
    }, { status: 400 });
  }
}
