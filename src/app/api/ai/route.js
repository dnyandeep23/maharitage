import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "../../../lib/mongoose";
import Chat from "../../../models/Chat";
import AIUsage from "../../../models/AIUsage";
import Site from "../../../models/Site";
import { verifyToken } from "../../../lib/jwt";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_GEMINI_RETRIES = 3;

// ⚡ Model fallback chain
const MODEL_FALLBACK_CHAIN = [
  "gemini-3.1-pro-preview",
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",

];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const escapeRegex = (value = "") =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function extractErrorStatus(error) {
  return error?.status || error?.response?.status || error?.cause?.status;
}

function isRetryableGeminiError(error) {
  const status = extractErrorStatus(error);
  return RETRYABLE_STATUS_CODES.has(status);
}

function parseStudentPayload(text) {
  if (typeof text !== "string") return null;
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

async function generateWithRetry(model, prompt) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_GEMINI_RETRIES; attempt++) {
    try {
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt === MAX_GEMINI_RETRIES)
        break;
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

async function generateWithModelFallback(prompt) {
  let lastError = null;
  for (let i = 0; i < MODEL_FALLBACK_CHAIN.length; i++) {
    const modelName = MODEL_FALLBACK_CHAIN[i];
    const model = ai.getGenerativeModel({ model: modelName });
    try {
      const result = await generateWithRetry(model, prompt);
      console.info(`AI response generated with model: ${modelName}`);
      return { result, modelName };
    } catch (error) {
      lastError = error;
      if (i < MODEL_FALLBACK_CHAIN.length - 1) {
        console.warn(
          `Model ${modelName} failed. Falling back to ${MODEL_FALLBACK_CHAIN[i + 1]}.`
        );
      }
    }
  }
  throw lastError;
}

export async function POST(req) {
  await connectDB();

  const {
    query,
    messages,
    fingerprint,
    chatId,
    quizMode = false,
    quizConfig = {},
    imageDatas,
  } = await req.json();

  if (!query || typeof query !== "string" || query.trim() === "") {
    return NextResponse.json(
      { success: false, error: "Query cannot be empty." },
      { status: 400 }
    );
  }

  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];
  const isQuizMode = Boolean(quizMode);

  // 🔐 Verify token
  let user = null;
  if (token) {
    try {
      const decoded = await verifyToken(token);
      user = { id: decoded.id, role: decoded.role };
    } catch (error) {
      // Invalid token — continue as anonymous
    }
  }

  // Quiz mode requires login
  if (isQuizMode && !user) {
    return NextResponse.json({
      success: false,
      error: "Please log in to access the quiz feature.",
      chatId: null,
    });
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
        { success: false, error: "Query limit exceeded for anonymous users." },
        { status: 429 }
      );
    }

    if (!usage) usage = new AIUsage({ fingerprint });
    usage.queryCount++;
    await usage.save();
  }

  // 🧠 Prepare conversation context — keep last 12 messages for multi-turn quiz accuracy
  const contextMessages = (messages || []).slice(-12).map((msg) => ({
    role: msg.role,
    parts: (msg.parts || []).map((part) => ({ text: part.text })),
  }));
  contextMessages.push({ role: "user", parts: [{ text: query }] });

  const conversationContext = contextMessages
    .map((msg, index) => {
      const content = (msg.parts || [])
        .map((part) => part?.text)
        .filter(Boolean)
        .join(" ");
      return `${index + 1}. ${msg.role.toUpperCase()}: ${content}`;
    })
    .join("\n");

  // 📊 Count AI turns so far — used to tell the model which question it's on
  const aiTurnCount = (messages || []).filter((m) => m.role === "ai").length;
  // The next question to be asked is aiTurnCount + 1 (0 AI turns = about to ask Q1)
  const currentQuestionNumber = aiTurnCount + 1;

  // Quiz config extraction
  const allowedDifficulties = new Set(["Easy", "Medium", "Hard"]);
  const allowedQuestionTypes = new Set(["MCQ", "Short Answer", "Mixed"]);
  const quizTopic =
    typeof quizConfig?.topic === "string" ? quizConfig.topic.trim() : "";
  const quizDifficulty = allowedDifficulties.has(quizConfig?.difficulty)
    ? quizConfig.difficulty
    : "Easy";
  const quizQuestionCount = Number.isFinite(Number(quizConfig?.questionCount))
    ? Math.min(Math.max(parseInt(quizConfig.questionCount, 10), 1), 20)
    : 5;
  const quizQuestionType = allowedQuestionTypes.has(quizConfig?.questionType)
    ? quizConfig.questionType
    : "MCQ";
  const audienceType = quizConfig?.audienceType || "general";

  try {
    // ─── Database Context ─────────────────────────────────────────────────────

    let matchedSites = [];
    let generalSites = [];

    if (isQuizMode && !quizTopic) {
      // 🌐 No topic given → sample broadly from the full dataset for variety
      const totalCount = await Site.countDocuments();
      const sampleSize = Math.min(15, totalCount);
      // Use aggregation to get a random diverse sample
      const randomSites = await Site.aggregate([
        { $sample: { size: sampleSize } },
      ]);
      matchedSites = randomSites;
    } else {
      // 🔍 Keyword-based search when topic is given or it's chat mode
      const siteQueryString = isQuizMode && quizTopic ? quizTopic : query;

      const stopWords = new Set([
        "tell", "me", "about", "what", "is", "the", "of", "in", "on",
        "a", "an", "and", "or", "for", "to", "with", "quiz", "generate",
        "create", "make", "questions", "question", "history", "heritage",
        "maharashtra", "easy", "medium", "hard", "mcq", "mixed",
      ]);
      const keywords = (siteQueryString || "")
        .toLowerCase()
        .split(/\s+/)
        .map((w) => w.replace(/[^a-z0-9]/g, ""))
        .filter((w) => w.length > 2 && !stopWords.has(w));

      const keywordConditions = keywords.map((kw) => {
        const safeKw = escapeRegex(kw);
        return {
          $or: [
            { site_name: { $regex: safeKw, $options: "i" } },
            { Site_discription: { $regex: safeKw, $options: "i" } },
            { "historical_context.cultural_significance": { $regex: safeKw, $options: "i" } },
            { "historical_context.ruler_or_dynasty": { $regex: safeKw, $options: "i" } },
            { heritage_type: { $regex: safeKw, $options: "i" } },
            { "location.district": { $regex: safeKw, $options: "i" } },
          ],
        };
      });

      if (keywordConditions.length > 0) {
        matchedSites = await Site.find({ $or: keywordConditions }).limit(6);
      }
    }

    // Always load general Maharashtra sites as baseline context (for chat mode)
    if (!isQuizMode || quizTopic) {
      generalSites = await Site.find({
        "location.state": { $regex: /maharashtra/i },
      }).limit(8);
    }

    // Merge: matched sites first, then general sites (dedup by _id)
    const seenIds = new Set();
    const allContextSites = [];
    for (const site of [...matchedSites, ...generalSites]) {
      const id = (site._id || site.id)?.toString();
      if (id && !seenIds.has(id)) {
        seenIds.add(id);
        allContextSites.push(site);
      }
    }

    const siteContext = allContextSites
      .map((site) => {
        const inscriptions = (site.Inscriptions || [])
          .slice(0, 3)
          .map(
            (ins) =>
              `- ID: ${ins.Inscription_id}
               Description: ${ins.discription}
               Language: ${ins.language_detected}
               Translation: ${ins.translations?.english || "N/A"}`
          )
          .join("\n");

        return `📍 Site: ${site.site_name}
Location: ${site.location?.district || ""}, ${site.location?.state || ""}, ${site.location?.country || ""}
Type: ${site.heritage_type || "Unknown"}
Period: ${site.period || "Unknown"}
Description: ${site.Site_discription || "N/A"}
Ruler/Dynasty: ${site.historical_context?.ruler_or_dynasty || "N/A"}
Cultural Significance: ${site.historical_context?.cultural_significance || "N/A"}

Inscriptions:
${inscriptions || "None"}

Gallery Images: ${(site.Gallary || []).join(", ") || "No images"}
─────────────────────────────`;
      })
      .join("\n\n");

    // 🔍 Context note
    const siteMatch = matchedSites[0] || null;
    let siteContextNote = "";
    if (isQuizMode && !quizTopic) {
      siteContextNote = `✅ Full dataset loaded (${allContextSites.length} diverse Maharashtra heritage sites). Generate varied questions spanning different sites, periods, and heritage types from the provided data.`;
    } else if (siteMatch) {
      const isInMaharashtra = siteMatch.location?.state
        ?.toLowerCase()
        .includes("maharashtra");
      if (isInMaharashtra) {
        siteContextNote = `✅ The site "${siteMatch.site_name}" was found in the database. Use this data to provide a detailed, accurate response.`;
      } else {
        siteContextNote = `⚠️ The site "${siteMatch.site_name}" exists but is in "${siteMatch.location?.state}". Reply: "I'm designed to focus only on the heritage of Maharashtra."`;
      }
    } else {
      const siteQueryString = isQuizMode && quizTopic ? quizTopic : query;
      siteContextNote = `No exact database match found for "${siteQueryString}".
IMPORTANT: If this topic is clearly related to Maharashtra heritage (e.g., Elephanta Caves, Shivaji Maharaj, Maratha forts, Ajanta, Ellora, etc.), you MUST still answer using your general knowledge about Maharashtra.
DO NOT refuse a valid Maharashtra heritage question just because it's not in the database.
Only refuse if the topic is genuinely outside Maharashtra or unrelated to heritage.`;
    }

    // ─── Quiz Mode Prompts ─────────────────────────────────────────────────────
    const GENERAL_QUIZ_PROMPT = `
You are **HeritageX Quiz Agent**, a highly intelligent and interactive AI designed for the Maha-Heritage project.

Your role is to conduct a structured, engaging, and strictly controlled quiz on Maharashtra heritage.

-----------------------------------
🧠 CORE BEHAVIOR RULES (VERY STRICT)
-----------------------------------

1. You MUST behave like an interactive quiz system, NOT a chatbot.
2. You MUST ask ONLY ONE question at a time.
3. You MUST WAIT for the user's answer before moving forward.
4. You MUST NEVER display multiple questions together.
5. You MUST NEVER skip or repeat question numbers.
6. You MUST NEVER reveal answers before user attempts.
7. You MUST ALWAYS follow the exact format defined below.

-----------------------------------
🎯 QUIZ CONFIGURATION
-----------------------------------

Topic: ${quizTopic || "Maharashtra Heritage"}
Difficulty: ${quizDifficulty}
Total Questions: ${quizQuestionCount}
Question Type: ${quizQuestionType}

-----------------------------------
📊 QUIZ STATE MANAGEMENT
-----------------------------------

- Current Question Number: ${currentQuestionNumber}
- Track user score internally
- Track correct/incorrect answers
- Use conversation history to maintain continuity

-----------------------------------
🧩 QUESTION GENERATION RULES
-----------------------------------

1. Questions MUST be:
   - Based on Maharashtra heritage only
   - Factually accurate
   - Non-repetitive
   - Clear and concise

2. Difficulty Levels:
   - Easy → Direct facts (location, names)
   - Medium → Conceptual understanding
   - Hard → Analytical / reasoning

3. Options:
   - Exactly 4 options (A, B, C, D)
   - Only ONE correct answer
   - Distractors must be realistic

-----------------------------------
📌 RESPONSE FORMAT (STRICT)
-----------------------------------

🔹 FIRST MESSAGE (Start Quiz):
(Use this format ONLY if current question number is 1)

📝 **Quiz: ${quizTopic || "Maharashtra Heritage"} — ${quizDifficulty}**
Total Questions: ${quizQuestionCount}

**Question 1 of ${quizQuestionCount}:**
[Question text]

A) [Option A text]
B) [Option B text]
C) [Option C text]
D) [Option D text]

👉 *Reply with A, B, C, or D*

-----------------------------------

🔹 AFTER USER ANSWERS:
(Use this format for questions 2 to ${quizQuestionCount})

Step 1: Evaluate answer

Step 2: Respond EXACTLY like:

✅ **Correct!**  
OR  
❌ **Wrong!**

Correct Answer: **[Correct Option]**

💡 Explanation:
[1–2 line explanation based on heritage knowledge]

---

**Question ${currentQuestionNumber} of ${quizQuestionCount}:**
[Next question]

A) [Option A text]
B) [Option B text]
C) [Option C text]
D) [Option D text]

👉 *Reply with A, B, C, or D*

-----------------------------------

🔹 AFTER FINAL QUESTION:
(Use this format when current question number is > ${quizQuestionCount})

🏆 **Quiz Complete!**

**Final Score: X / ${quizQuestionCount}**

📊 Performance:
- 80–100% → Excellent 🎉
- 50–79% → Good 👍
- Below 50% → Needs Improvement 📚

📋 Results Summary:
| # | Question | Your Answer | Correct Answer | Result | Explanation |
|---|----------|-------------|----------------|--------|-------------|
| 1 | [Short question] | A | B | ❌ | [Short explanation] |

💡 Feedback:
[Encouraging message based on score]

-----------------------------------
🚫 STRICT PROHIBITIONS
-----------------------------------

- DO NOT generate all questions at once
- DO NOT break format
- DO NOT give long paragraphs
- DO NOT go outside Maharashtra heritage
- DO NOT hallucinate facts
- DO NOT continue if user has not answered

-----------------------------------
🧠 INTELLIGENCE RULES
-----------------------------------

- If user input is not A/B/C/D → ask them to answer properly
- If user tries to skip → remind them to answer current question
- If user repeats → handle gracefully

-----------------------------------
🎯 FINAL GOAL
-----------------------------------

Make the experience feel like a real competitive quiz system:
- Clean
- Interactive
- Structured
- Engaging
`;

const STUDENT_AUI_PROMPT = `
You are **HeritageX Game Engine**, powering a gamified quiz for young students learning about Maharashtra heritage.

==================================================
🎮 CRITICAL: YOU MUST RETURN VALID JSON ONLY
==================================================

Your response MUST be a single valid JSON object. No markdown, no text before or after. Just pure JSON.

Follow this schema exactly:

{
  "type": "question" | "feedback" | "complete" | "error",
  "question": "string or null",
  "questionNumber": number,
  "totalQuestions": ${quizQuestionCount},
  "options": ["option 1", "option 2", "option 3", "option 4"],
  "xp": number,
  "totalXp": number,
  "progress": number,
  "level": "Explorer",
  "encouragement": "short upbeat line",
  "isCorrect": true | false | null,
  "correctAnswer": "A" | "B" | "C" | "D" | null,
  "explanation": "short explanation or empty string",
  "finalScore": number | null,
  "performance": "excellent" | "good" | "needs_improvement" | null,
  "message": "completion or error message",
  "report": [
    {
      "questionNumber": 1,
      "question": "string",
      "selectedAnswer": "A",
      "correctAnswer": "B",
      "isCorrect": false,
      "explanation": "string"
    }
  ],
  "nextQuestion": {
    "question": "string",
    "questionNumber": number,
    "totalQuestions": ${quizQuestionCount},
    "options": ["option 1", "option 2", "option 3", "option 4"]
  } | null
}

Rules:
1. Topic: ${quizTopic || "Maharashtra Heritage"}
2. Difficulty: ${quizDifficulty} (Easy=direct facts, Medium=conceptual, Hard=analytical)
3. Total questions: ${quizQuestionCount}
4. Current question number: ${currentQuestionNumber}
5. Options MUST be exactly 4 strings with no A/B/C/D prefixes.
6. Language must be kid-friendly, crisp, and factually accurate.
7. Ask only one question at a time.
8. Track score across the conversation context.
9. For "question", fill question/options and set quiz-result fields to null or empty values.
10. For "feedback", include isCorrect, correctAnswer, explanation, encouragement, and the next question in "nextQuestion" unless the quiz is over.
11. For "complete", set progress to 100, include finalScore, performance, a full "report" array for all questions, and set nextQuestion to null.
12. For invalid student input, return:
{"type":"error","question":null,"questionNumber":${currentQuestionNumber},"totalQuestions":${quizQuestionCount},"options":[],"xp":0,"totalXp":0,"progress":0,"level":"Explorer","encouragement":"Please tap one of the answer buttons!","isCorrect":null,"correctAnswer":null,"explanation":"","finalScore":null,"performance":null,"message":"Please tap A, B, C, or D to answer!","report":[],"nextQuestion":null}
13. NEVER return markdown or plain text. ONLY valid JSON.
`;

    const quizModeRules = isQuizMode
      ? (audienceType === "student" ? STUDENT_AUI_PROMPT : GENERAL_QUIZ_PROMPT)
      : "";

    // ─── System Prompt ────────────────────────────────────────────────────────
    const systemPrompt = `
You are **HeritageX**, an intelligent AI assistant developed for the **Maha-Heritage Project**, dedicated to exploring
the culture, art, monuments, and history of **Maharashtra**.

🧭 **Response Guidelines:**
1. Only discuss Maharashtra's heritage, culture, and history.
2. If the query refers to something outside Maharashtra, reply:
   "I'm sorry, but I'm designed to focus only on the heritage of Maharashtra."
3. If unrelated to heritage or culture, reply:
   "I'm sorry, but I can only answer questions related to heritage, history, or culture as part of the Maha-Heritage."
4. When responding, include images using this tag: **[Image: <URL>]** if available from Gallery Images.
5. Do **not** include references or sources unless the user specifically asks for them.
6. For normal chat mode, keep responses crisp and readable:
   - Start with a short summary (2-3 sentences)
   - Then 3-5 bullet points
   - Keep under 200 words unless user asks for detailed explanation
7. Do not invent facts. If data is unavailable, say it clearly.

🧠 **Database Context (${allContextSites.length} sites loaded):**
${siteContext}

🗂️ **Recent Conversation Context:**
${conversationContext || "No prior context."}

📌 **Context Based on Query:**
${siteContextNote}

🧪 **Mode:**
${isQuizMode ? "Quiz Mode Enabled" : "Normal Chat Mode"}
${quizModeRules}

💬 **User Query:**
"${query}"

Now provide a relevant, structured, and culturally rich answer following the rules above.
`;

    // 🎯 Generate Gemini response
    const geminiPrompt = [systemPrompt];
    if (imageDatas && imageDatas.length > 0) {
      imageDatas.forEach(img => {
        geminiPrompt.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
      });
    }
      
    const { result, modelName } = await generateWithModelFallback(geminiPrompt);
    const aiText =
      result.response.text() ||
      "I had trouble generating a response. Please try again.";
    const studentPayload =
      isQuizMode && audienceType === "student"
        ? parseStudentPayload(aiText)
        : null;

    // 💾 Save chat if user is logged in
    let currentChatId = chatId;
    if (user) {
      let chat;
      if (currentChatId) chat = await Chat.findById(currentChatId);
      else {
        chat = new Chat({
          userId: user.id,
          title: query.substring(0, 30),
          mode: isQuizMode ? 'quiz' : 'chat',
          audienceType: audienceType,
          messages: [],
        });
      }

      if (chat) {
        chat.messages.push({ sender: "user", message: query });
        chat.messages.push({ sender: "ai", message: aiText });
        chat.mode = isQuizMode ? "quiz" : "chat";
        chat.audienceType = audienceType;
        if (studentPayload) {
          if (typeof studentPayload.finalScore === "number") {
            chat.score = studentPayload.finalScore;
          } else if (typeof studentPayload.score === "number") {
            chat.score = studentPayload.score;
          }
          if (typeof studentPayload.progress === "number") {
            chat.progress = studentPayload.progress;
          }
        }
        await chat.save();
        currentChatId = chat._id.toString();
      }
    }

    return NextResponse.json({ success: true, data: { response: aiText, chatId: currentChatId } });
  } catch (error) {
    const status = extractErrorStatus(error);
    const isTransient = status === 429 || status === 503;

    console.error("Error generating AI response:", error);

    if (isTransient) {
      return NextResponse.json(
        { success: false, error: "The AI model is currently busy. Please try again shortly." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to get response from AI." },
      { status: 500 }
    );
  }
}
