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
  "gemini-2.5-flash",
  "gemini-2.5-pro",

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
  } = await req.json();

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
      response: "Please log in to access the quiz feature.",
      chatId: null,
    });
  }

  // 🚫 Handle anonymous usage limits
  if (!user) {
    if (!fingerprint) {
      return NextResponse.json(
        { error: "Fingerprint is required for anonymous users." },
        { status: 400 }
      );
    }

    let usage = await AIUsage.findOne({ fingerprint });
    if (usage && usage.queryCount >= 3) {
      return NextResponse.json(
        { error: "Query limit exceeded for anonymous users." },
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

    // ─── Quiz Mode Prompt ─────────────────────────────────────────────────────
    const quizModeRules = isQuizMode
      ? `
You are an INTERACTIVE Quiz Master for Maharashtra Heritage learning.

**Quiz Configuration:**
- Topic: ${quizTopic || "General Maharashtra Heritage (full dataset — use varied sites)"}
- Difficulty: ${quizDifficulty}
- Total questions: ${quizQuestionCount}
- Question type: ${quizQuestionType}
- Current question number (based on conversation turns): ${currentQuestionNumber}

**CRITICAL INTERACTIVE RULES — FOLLOW EXACTLY:**

1. **FIRST MESSAGE (quiz start, when currentQuestionNumber = 1):**
   Present ONLY Question 1. Format exactly:

📝 **Quiz: ${quizTopic || "Maharashtra Heritage"} — ${quizDifficulty}**
Total Questions: ${quizQuestionCount}

**Question 1 of ${quizQuestionCount}:**
[Question text here]

A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

👉 *Select your answer (A, B, C, or D)*

2. **WHEN USER ANSWERS (e.g., "A", "B", "option C", etc.):**
   - Check the answer
   - Tell them ✅ Correct or ❌ Wrong
   - Show the correct answer
   - Give a brief 1-2 line explanation
   - Then immediately show the NEXT question (question number = currentQuestionNumber)
   - Example:

✅ **Correct!** The answer is **B**.
💡 *[Brief explanation]*

---

**Question ${currentQuestionNumber} of ${quizQuestionCount}:**
[Next question]

A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

👉 *Select your answer (A, B, C, or D)*

3. **AFTER THE LAST QUESTION IS ANSWERED (when currentQuestionNumber > ${quizQuestionCount}):**
   Show the final results:

🏆 **Quiz Complete!**

**Your Score: X / ${quizQuestionCount}**

📊 **Results Summary:**
| # | Question | Your Answer | Correct Answer | Result |
|---|----------|-------------|----------------|--------|
| 1 | [Short question] | A | B | ❌ |
| 2 | [Short question] | C | C | ✅ |

📖 **Detailed Explanations:**
**Q1:** [Full explanation]
**Q2:** [Full explanation]

[Encouraging message based on score]

4. **TURN TRACKING:** You are currently on turn ${currentQuestionNumber} out of ${quizQuestionCount}. The conversation context below shows all previous questions and answers. Count carefully.

5. **If topic is General Maharashtra Heritage:** Generate questions that span DIFFERENT sites and periods from the database context. Do NOT repeat the same site twice.

**Difficulty Logic:**
- Easy: direct factual recall
- Medium: conceptual understanding
- Hard: analytical / cause-effect reasoning

**Use ONLY facts from database context. Do NOT hallucinate.**
**Tone: Encouraging, student-friendly, like a fun teacher.**
`
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
    const { result, modelName } = await generateWithModelFallback(systemPrompt);
    const aiText =
      result.response.text() ||
      "I had trouble generating a response. Please try again.";

    // 💾 Save chat if user is logged in
    let currentChatId = chatId;
    if (user) {
      let chat;
      if (currentChatId) chat = await Chat.findById(currentChatId);
      else {
        chat = new Chat({
          userId: user.id,
          title: query.substring(0, 30),
          messages: [],
        });
      }

      if (chat) {
        chat.messages.push({ sender: "user", message: query });
        chat.messages.push({ sender: "ai", message: aiText });
        await chat.save();
        currentChatId = chat._id.toString();
      }
    }

    return NextResponse.json({ response: aiText, chatId: currentChatId });
  } catch (error) {
    const status = extractErrorStatus(error);
    const isTransient = status === 429 || status === 503;

    console.error("Error generating AI response:", error);

    if (isTransient) {
      return NextResponse.json(
        { error: "The AI model is currently busy. Please try again shortly." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get response from AI." },
      { status: 500 }
    );
  }
}