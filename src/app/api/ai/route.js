import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "../../../lib/mongoose";
import User from "../../../models/User";
import Chat from "../../../models/Chat";
import AIUsage from "../../../models/AIUsage";
import Site from "../../../models/Site";
import { verifyToken } from "../../../lib/jwt";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  await connectDB();

  const { query, messages, fingerprint, chatId } = await req.json();
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.split(" ")[1];

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

  // 🧠 Prepare conversation context
  const contextMessages = (messages || []).map((msg) => ({
    role: msg.role,
    parts: msg.parts.map((part) => ({ text: part.text })),
  }));
  contextMessages.push({ role: "user", parts: [{ text: query }] });

  try {
    // 🏛 Load heritage database
    const sites = await Site.find({});
    const siteContext = sites
      .map((site) => {
        const inscriptions = (site.Inscriptions || [])
          .map(
            (ins) =>
              `- ID: ${ins.Inscription_id}
               Description: ${ins.discription}
               Language: ${ins.language_detected}
               Translation: ${ins.translations?.english || "N/A"}`
          )
          .join("\n");

        // 📝 We include references but tell the model to use them *only* when asked
        const references = (site.references || [])
          .map(
            (ref) =>
              `- ${ref.title} by ${ref.author} (${ref.year}) [${
                ref.url || "No URL"
              }]`
          )
          .join("\n");

        return `📍 Site: ${site.site_name}
Location: ${site.location?.district || ""}, ${site.location?.state || ""}, ${
          site.location?.country || ""
        }
Type: ${site.heritage_type || "Unknown"}
Period: ${site.period || "Unknown"}
Description: ${site.Site_discription || "N/A"}
Ruler/Dynasty: ${site.historical_context?.ruler_or_dynasty || "N/A"}
Approx. Date: ${site.historical_context?.approx_date || "N/A"}
Cultural Significance: ${
          site.historical_context?.cultural_significance || "N/A"
        }

Inscriptions:
${inscriptions || "None"}

References (only if asked by user):
${references || "None"}

Gallery Images: ${(site.Gallary || []).join(", ") || "No images"}
─────────────────────────────`;
      })
      .join("\n\n");

    // 🔍 Check if site is known in DB
    const siteMatch = await Site.findOne({
      site_name: { $regex: query, $options: "i" },
    });

    let siteContextNote = "";
    if (siteMatch) {
      const isInMaharashtra = siteMatch.location?.state
        ?.toLowerCase()
        .includes("maharashtra");

      if (isInMaharashtra) {
        siteContextNote = `✅ The site "${siteMatch.site_name}" is part of Maharashtra's heritage. Provide a detailed and culturally rich response.`;
      } else {
        siteContextNote = `⚠️ The site "${siteMatch.site_name}" exists in the database but is located in "${siteMatch.location?.state}". 
You are designed exclusively for Maharashtra’s heritage, so respond with:
"I’m sorry, but I’m designed to focus only on the heritage of Maharashtra."`;
      }
    } else {
      siteContextNote = `No direct database match found for "${query}". 
If the topic seems related to Maharashtra (forts, dynasties, festivals, etc.), respond with general knowledge about Maharashtra.
Otherwise, reply with:
"I'm sorry, but I can only answer questions related to Maharashtra's heritage, history, or culture."`;
    }

    // 🤖 Initialize Gemini
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 🧩 System Prompt
    const systemPrompt = `
You are **HeritageX**, an intelligent AI assistant developed for the **Maha-Heritage Project**, dedicated to exploring 
the culture, art, monuments, and history of **Maharashtra**.

🧭 **Response Guidelines:**
1. Only discuss Maharashtra’s heritage, culture, and history.
2. If the query refers to something outside Maharashtra, reply:
   "I’m sorry, but I’m designed to focus only on the heritage of Maharashtra."
3. If unrelated to heritage or culture, reply:
   "I'm sorry, but I can only answer questions related to heritage, history, or culture as part of the Maha-Heritage."
4. When responding, include images using this tag: **[Image: <URL>]** if available.
5. Do **not** include references or sources unless the user specifically asks for them (e.g. “show references”, “what are the sources?”, etc.).
6. Use a modern, factual, engaging tone — formatted like an informative article.

🧠 **Database Context:**
${siteContext}

📌 **Context Based on Query:**
${siteContextNote}

💬 **User Query:**
"${query}"

Now provide a relevant, structured, and culturally rich answer following the rules above.
`;

    // 🎯 Generate Gemini response
    const result = await model.generateContent(systemPrompt);
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
          title: query.substring(0, 20),
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
    console.error("Error generating AI response:", error);
    return NextResponse.json(
      { error: "Failed to get response from AI." },
      { status: 500 }
    );
  }
}
