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

// ⚡ Model fallback chains
const VISION_MODEL_CHAIN = [
  "gemini-3.1-pro-preview",
  "gemini-1.5-pro",
];

const TEXT_MODEL_CHAIN = [
  "gemini-3.1-flash-lite-preview",
  "gemini-3-flash-preview",
  "gemini-1.5-flash",
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

async function generateChatStreamWithRetry(model, history, userMessage) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_GEMINI_RETRIES; attempt++) {
    try {
      const chat = model.startChat({ history });
      return await chat.sendMessageStream(userMessage);
    } catch (error) {
      lastError = error;
      if (!isRetryableGeminiError(error) || attempt === MAX_GEMINI_RETRIES)
        break;
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }
  throw lastError;
}

async function generateStreamWithModelFallback(systemInstruction, history, userMessage, responseMimeType = "text/plain", hasImage = false) {
  let lastError = null;
  const chain = hasImage ? VISION_MODEL_CHAIN : TEXT_MODEL_CHAIN;

  for (let i = 0; i < chain.length; i++) {
    const modelName = chain[i];
    const model = ai.getGenerativeModel({ 
      model: modelName,
      systemInstruction: systemInstruction,
      generationConfig: responseMimeType === "application/json" ? { responseMimeType: "application/json" } : {}
    });
    try {
      const resultStream = await generateChatStreamWithRetry(model, history, userMessage);
      console.info(`AI stream generated with model: ${modelName}`);
      return { resultStream, modelName };
    } catch (error) {
      lastError = error;
      if (i < chain.length - 1) {
        console.warn(
          `Model ${modelName} failed. Falling back to ${chain[i + 1]}.`
        );
      }
    }
  }
  throw lastError;
}

// 📦 In-Memory Cache for Site Data
let siteCache = {
  data: [],
  lastFetched: 0,
};

const CACHE_TTL = 1000 * 60 * 60; // 1 hour

async function getCachedSites() {
  if (siteCache.data.length > 0 && Date.now() - siteCache.lastFetched < CACHE_TTL) {
    return siteCache.data;
  }
  const sites = await Site.find({}).lean();
  siteCache.data = sites;
  siteCache.lastFetched = Date.now();
  return sites;
}

// 🖼️ Local Image Validation logic
function validateImageLocally(imageUrl, matchedSites) {
  // If no DB matches are found, we can't validate the image properly against the dataset
  if (!matchedSites || matchedSites.length === 0) {
    return { status: 'no_match', reason: 'No site context to validate against' };
  }

  // Check if the AI's generated URL perfectly matches any image in the current site's gallery
  const targetSite = matchedSites[0];
  const gallery = targetSite.Gallary || [];

  if (gallery.includes(imageUrl)) {
    return { status: 'exact_match', reason: 'Exact URL match in database' };
  } else if (gallery.length > 0) {
    // If it generated an image but the URL is wrong, we do a partial match to replace it
    return { status: 'partial_match', reason: 'URL not in database, replacing with correct image' };
  }

  return { status: 'no_match', reason: 'Invalid image URL and no replacements available' };
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

  // 🧠 Build proper multi-turn chat history for Gemini (ChatGPT-style context)
  const rawHistory = (messages || []).slice(-12).map((msg) => ({
    role: msg.role === "ai" ? "model" : "user",
    parts: (msg.parts || [])
      .map((part) => ({ text: part.text || "" }))
      .filter((p) => p.text.length > 0),
  })).filter((msg) => msg.parts.length > 0);

  // Gemini requires history to start with "user" and alternate roles
  // Merge consecutive same-role messages and ensure proper alternation
  const chatHistory = [];
  for (const msg of rawHistory) {
    const last = chatHistory[chatHistory.length - 1];
    if (last && last.role === msg.role) {
      // Merge into the previous message
      last.parts.push(...msg.parts);
    } else {
      chatHistory.push({ ...msg, parts: [...msg.parts] });
    }
  }
  // If history starts with "model", drop it (Gemini requirement)
  while (chatHistory.length > 0 && chatHistory[0].role === "model") {
    chatHistory.shift();
  }

  // Build the current user message (may include images)
  const currentUserParts = [{ text: query }];

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
4. If the user asks who developed, created, or made you, you MUST reply EXACTLY with:
   "This bot is an academic project at Sardar Patel Institute of Technology driven by third-year students Dnyandeep Gaonkar, Rudrapratapsing Rajput, and Shreeya Nemade under the guidance of Professor Miss. Jyoti Ramteke."
5. If your response needs an image to illustrate a site or monument, DO NOT write a URL. Instead, write EXACTLY: [Image needed: Exact Site Name] (e.g., [Image needed: Ajanta Caves]). Our local system will automatically provide the image.
6. Do **not** include references or sources unless the user specifically asks for them.
7. For normal chat mode, keep responses crisp and readable:
   - Start with a short summary (2-3 sentences)
   - Then 3-5 bullet points
   - Keep under 200 words unless user asks for detailed explanation
8. Do not invent facts. If data is unavailable, say it clearly.

🧠 **Database Context (${allContextSites.length} sites loaded):**
${siteContext}

📌 **Context Based on Query:**
${siteContextNote}

🧪 **Mode:**
${isQuizMode ? "Quiz Mode Enabled" : "Normal Chat Mode"}
${quizModeRules}

Now provide a relevant, structured, and culturally rich answer following the rules above.
`;

    // 🎯 Generate Gemini response using multi-turn chat
    // Add images to the user message if present
    if (imageDatas && imageDatas.length > 0) {
      imageDatas.forEach(img => {
        currentUserParts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
      });
    }
      
    // 💾 Create chat document if user is logged in before streaming starts
    let currentChatId = chatId;
    let chatDoc = null;
    if (user) {
      if (currentChatId) {
        chatDoc = await Chat.findById(currentChatId);
      } else {
        chatDoc = new Chat({
          userId: user.id,
          title: query.substring(0, 30),
          mode: isQuizMode ? 'quiz' : 'chat',
          audienceType: audienceType,
          messages: [],
        });
        await chatDoc.save();
        currentChatId = chatDoc._id.toString();
      }
    }

    const hasImage = imageDatas && imageDatas.length > 0;
    const { resultStream, modelName } = await generateStreamWithModelFallback(
      systemPrompt,
      chatHistory,
      currentUserParts,
      isQuizMode && audienceType === "student" ? "application/json" : "text/plain",
      hasImage
    );

    const encoder = new TextEncoder();
    let accumulatedText = "";

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const cachedSites = await getCachedSites();
          let streamBuffer = "";

          for await (const chunk of resultStream.stream) {
            streamBuffer += chunk.text();

            // Replace [Image needed: ...] tags with actual DB URLs
            const imgRegex = /\[Image needed:\s*([^\]]+)\]/gi;
            let match;
            while ((match = imgRegex.exec(streamBuffer)) !== null) {
               const queryName = match[1];
               const site = cachedSites.find(s => 
                 s.site_name?.toLowerCase().includes(queryName.toLowerCase()) || 
                 queryName.toLowerCase().includes(s.site_name?.toLowerCase())
               );
               const imgUrl = site && site.Gallary && site.Gallary.length > 0 ? site.Gallary[0] : "";
               
               if (imgUrl) {
                 streamBuffer = streamBuffer.replace(match[0], `[Image: ${imgUrl}]`);
               } else {
                 streamBuffer = streamBuffer.replace(match[0], "");
               }
            }

            // Flush logic: retain buffer if there's an unclosed '['
            const lastOpenBracket = streamBuffer.lastIndexOf('[');
            const lastCloseBracket = streamBuffer.lastIndexOf(']');
            
            let safeToFlush = streamBuffer;
            let retain = "";
            
            if (lastOpenBracket > lastCloseBracket) {
               safeToFlush = streamBuffer.substring(0, lastOpenBracket);
               retain = streamBuffer.substring(lastOpenBracket);
            }
            
            if (safeToFlush.length > 0) {
               accumulatedText += safeToFlush;
               controller.enqueue(encoder.encode(safeToFlush));
               streamBuffer = retain;
            }
          }

          if (streamBuffer.length > 0) {
             accumulatedText += streamBuffer;
             controller.enqueue(encoder.encode(streamBuffer));
          }

          controller.close();

          // Background task: save chat to DB
          Promise.resolve().then(async () => {
            let finalAiText = accumulatedText;

            const studentPayload =
              isQuizMode && audienceType === "student"
                ? parseStudentPayload(finalAiText)
                : null;

            if (chatDoc) {
              chatDoc.messages.push({ sender: "user", message: query });
              chatDoc.messages.push({ sender: "ai", message: finalAiText });
              chatDoc.mode = isQuizMode ? "quiz" : "chat";
              chatDoc.audienceType = audienceType;
              if (studentPayload) {
                if (typeof studentPayload.finalScore === "number") {
                  chatDoc.score = studentPayload.finalScore;
                } else if (typeof studentPayload.score === "number") {
                  chatDoc.score = studentPayload.score;
                }
                if (typeof studentPayload.progress === "number") {
                  chatDoc.progress = studentPayload.progress;
                }
              }
              await chatDoc.save();
            }
          }).catch(console.error);
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    const responseHeaders = new Headers({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    if (currentChatId) {
      responseHeaders.set("X-Chat-Id", currentChatId);
    }

    return new Response(stream, { headers: responseHeaders });
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
