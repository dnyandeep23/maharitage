export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getHFVisualPrediction } from '@/lib/hfVisualInference';

const LETTERS = ["A", "B", "C", "D"];
const LOCAL_VISUAL_SERVICE_URL = process.env.LOCAL_VISUAL_SERVICE_URL || "http://127.0.0.1:8000/predict";

// Helper function to resolve trusted question data from canonical gold benchmark or annotation JSON files
function getTrustedQuestion(questionId) {
  if (!questionId) return null;
  const processCwd = process.cwd();
  
  // 1. Check frozen canonical V4 benchmark
  const v4Path = path.join(processCwd, 'src/ai/quiz-engine/data/benchmarks/visual_gold/v4_gallery_reasoning/questions/v4_gallery_gold.json');
  if (fs.existsSync(v4Path)) {
    try {
      const v4Items = JSON.parse(fs.readFileSync(v4Path, 'utf8'));
      const found = v4Items.find(item => 
        item.benchmark_id === questionId || 
        item.question_id === questionId ||
        item.annotation_id === questionId ||
        `v4_item_${item.correct_option_index}` === questionId
      );
      if (found) {
        const goldIdx = typeof found.correct_option_index === 'number' ? found.correct_option_index : 0;
        return {
          questionId: found.benchmark_id || questionId,
          type: "image",
          question: found.question,
          options: found.options,
          correctAnswer: LETTERS[goldIdx],
          imageUrl: found.image_url || found.url || null
        };
      }
    } catch (e) {
      console.error("Error reading V4 benchmark:", e);
    }
  }

  // 2. Search clean annotations directory (text, visual/image, visual/inscription)
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
          const content = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
          const annList = Array.isArray(content) ? content : [content];
          for (const item of annList) {
            if (item.annotation_id === questionId || item.benchmark_id === questionId || file.replace('.json', '') === questionId) {
              const goldIdx = typeof item.correct_option_index === 'number' ? item.correct_option_index : 0;
              return {
                questionId: item.annotation_id || questionId,
                type: type,
                question: item.question,
                options: item.options,
                correctAnswer: LETTERS[goldIdx],
                imageUrl: item.image_url || null
              };
            }
          }
        }
      } catch (e) {
        // Skip malformed
      }
    }
  }

  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, questionId, selectedAnswer } = body || {};

    // Validate parameters
    if (!questionId || typeof questionId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid or missing questionId' },
        { status: 400 }
      );
    }

    if (!selectedAnswer || !LETTERS.includes(selectedAnswer.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: 'selectedAnswer must be exactly A, B, C, or D' },
        { status: 400 }
      );
    }

    const cleanUserAnswer = selectedAnswer.toUpperCase();

    // Retrieve trusted ground-truth question data server-side
    const trustedData = getTrustedQuestion(questionId);
    if (!trustedData) {
      return NextResponse.json(
        { success: false, error: `Question not found in server registry: ${questionId}` },
        { status: 404 }
      );
    }

    // Compute user score strictly against trusted ground truth
    const isCorrect = (cleanUserAnswer === trustedData.correctAnswer);
    const earnedXp = isCorrect ? 10 : 0;

    let aiVisualReasoning = {
      status: "not_applicable"
    };

    // ROUTING DECISION:
    // If Image Question (has trusted imageUrl), call Hugging Face Hosted Visual Inference API
    if (trustedData.imageUrl && Array.isArray(trustedData.options) && trustedData.options.length >= 4) {
      aiVisualReasoning = await getHFVisualPrediction({
        question: trustedData.question,
        options: trustedData.options,
        imageUrl: trustedData.imageUrl
      });
    }

    console.log(`[QUIZ] questionId=${trustedData.questionId} questionType=${trustedData.type || (trustedData.imageUrl ? "image" : "text")}`);
    if (aiVisualReasoning.status === "success") {
      console.log(`[VISUAL] model=${aiVisualReasoning.model} adapter=${aiVisualReasoning.adapter} prediction=${aiVisualReasoning.prediction} latency=${aiVisualReasoning.latencyMs}ms`);
    }
    console.log(`[QUIZ] groundTruth=${trustedData.correctAnswer} userAnswer=${cleanUserAnswer} userCorrect=${isCorrect}`);

    return NextResponse.json({
      success: true,
      data: {
        sessionId: sessionId || "unified_session",
        questionId: trustedData.questionId,
        questionType: trustedData.type || (trustedData.imageUrl ? "image" : "text"),
        userResult: {
          selectedAnswer: cleanUserAnswer,
          correctAnswer: trustedData.correctAnswer,
          isCorrect,
          earnedXp
        },
        aiVisualReasoning
      }
    });

  } catch (error) {
    console.error("Submit Answer API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
