export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "../../../../lib/mongoose";
import AIUsage from "../../../../models/AIUsage";
import { verifyToken } from "../../../../lib/jwt";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_GEMINI_RETRIES = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function extractErrorStatus(error) {
  return error?.status || error?.response?.status || error?.cause?.status;
}

function extractErrorMessage(error) {
  return (
    error?.message ||
    error?.statusText ||
    error?.response?.statusText ||
    ""
  );
}

function isQuotaExceededError(error) {
  const status = extractErrorStatus(error);
  const message = extractErrorMessage(error).toLowerCase();
  return (
    status === 429 &&
    (message.includes("quota exceeded") ||
      message.includes("billing details") ||
      message.includes("rate limit"))
  );
}

function isRetryableGeminiError(error) {
  if (isQuotaExceededError(error)) return false;
  const status = extractErrorStatus(error);
  return RETRYABLE_STATUS_CODES.has(status);
}

function validateQuizJSON(data, requiredCount) {
  if (!data || !Array.isArray(data.quiz)) return false;
  if (data.quiz.length !== requiredCount) return false;

  for (const q of data.quiz) {
    if (!q.id || typeof q.id !== "string") return false;
    if (!q.question || typeof q.question !== "string" || q.question.trim() === "") return false;
    if (!q.options || typeof q.options !== "object") return false;
    if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) return false;
    
    // Check non-empty options
    if (Object.values(q.options).some(opt => typeof opt !== "string" || opt.trim() === "")) return false;

    if (!q.answer || typeof q.answer !== "string" || !["A", "B", "C", "D"].includes(q.answer)) return false;
    
    // Check no exact duplicate questions or options inside a single question
    const optionValues = new Set(Object.values(q.options).map(v => v.trim().toLowerCase()));
    if (optionValues.size < 4) return false; // Contains duplicate options
  }
  return true;
}

export async function POST(req) {
  await connectDB();

  try {
    const {
      topic,
      difficulty,
      questionCount,
      questionType,
      audienceType,
      fingerprint,
    } = await req.json();

    const count = Number.isFinite(Number(questionCount)) 
      ? Math.min(Math.max(parseInt(questionCount, 10), 1), 20) 
      : 5;

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.split(" ")[1];

    let user = null;
    if (token) {
      try {
        const decoded = await verifyToken(token);
        user = { id: decoded.id, role: decoded.role };
      } catch (error) {
        // Invalid token — continue as anonymous
      }
    }

    // 🚫 Handle anonymous usage limits
    if (!user) {
      if (!fingerprint) {
        return NextResponse.json(
          { success: false, error: "Fingerprint is required for anonymous users." },
          { status: 400 }
        );
      }

      let usage = await AIUsage.findOne({ fingerprint });
      if (usage && usage.queryCount >= 3) {
        return NextResponse.json(
          { success: false, error: "Quiz generation is temporarily unavailable. Please try again later." },
          { status: 429 }
        );
      }

      if (!usage) usage = new AIUsage({ fingerprint });
      usage.queryCount++;
      await usage.save();
    }

    const topicText = topic && topic.trim() !== "" 
      ? topic.trim() 
      : "a balanced mix covering caves, forts, monuments, dynasties, architecture, inscriptions, culture, and chronology in Maharashtra";

    const systemInstruction = `You are a strict Quiz Generation API for the Maha-Heritage project.
Your ONLY output must be a valid JSON object matching this exact structure:
{
  "quiz": [
    {
      "id": "q1",
      "question": "Clear, direct question about Maharashtra heritage...",
      "options": {
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      },
      "answer": "A",
      "explanation": "Brief explanation...",
      "difficulty": "Easy",
      "category": "...",
      "source": "..."
    }
  ]
}

RULES:
1. Generate EXACTLY ${count} questions.
2. The topic is: ${topicText}.
3. Difficulty: ${difficulty}.
4. Type: ${questionType}.
5. Options must be exactly 4 unique strings.
6. The answer must be EXACTLY "A", "B", "C", or "D".
7. Focus strictly on Maharashtra heritage, history, culture.
8. DO NOT invent obscure facts merely to fill the count. Use reliable historical data.
9. ONLY return valid JSON. Do not include markdown formatting like \`\`\`json.`;

    const modelName = "gemini-3.5-flash-lite";
    const model = ai.getGenerativeModel({
      model: modelName,
      systemInstruction,
      generationConfig: { responseMimeType: "application/json" }
    });

    const userMessage = `Please generate ${count} ${difficulty} MCQ questions on ${topicText}.`;

    let generatedData = null;
    let lastError = null;
    let valid = false;

    // We allow up to 3 generation attempts (for API errors or malformed JSON)
    for (let attempt = 1; attempt <= MAX_GEMINI_RETRIES; attempt++) {
      try {
        const result = await model.generateContent(userMessage);
        const text = result.response.text();
        
        try {
          const parsed = JSON.parse(text);
          if (validateQuizJSON(parsed, count)) {
            generatedData = parsed;
            valid = true;
            break;
          } else {
            throw new Error("Validation failed");
          }
        } catch (parseError) {
          if (attempt === MAX_GEMINI_RETRIES) break;
          await sleep(1000 * 2 ** (attempt - 1));
          continue;
        }
      } catch (apiError) {
        lastError = apiError;
        if (!isRetryableGeminiError(apiError) || attempt === MAX_GEMINI_RETRIES) {
          break;
        }
        await sleep(1000 * 2 ** (attempt - 1));
      }
    }

    if (valid && generatedData) {
      return NextResponse.json({ success: true, data: generatedData });
    } else {
      console.error("Failed to generate a valid quiz:", lastError);
      if (lastError && isQuotaExceededError(lastError)) {
        return NextResponse.json(
          { success: false, error: "Quiz generation is temporarily unavailable. Please try again later." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { success: false, error: "We couldn't generate a valid quiz. Please try again." },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Quiz API Error:", error);
    return NextResponse.json(
      { success: false, error: "Quiz generation is temporarily unavailable. Please try again." },
      { status: 500 }
    );
  }
}
