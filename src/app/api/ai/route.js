import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import connectDB from "../../../lib/mongoose";
import User from "../../../models/User";
import Chat from "../../../models/Chat";
import AIUsage from "../../../models/AIUsage";
import { verifyToken } from "../../../lib/jwt";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  await connectDB();

  const { query, messages, fingerprint, chatId } = await req.json();
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.split(" ")[1];

  let user = null;
  if (token) {
    try {
      const decoded = await verifyToken(token);
      user = { id: decoded.id, role: decoded.role };
    } catch (error) {
      // Invalid token, treat as anonymous user
    }
  }

  // Handle anonymous users and usage limits
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

    if (!usage) {
      usage = new AIUsage({ fingerprint });
    }
    usage.queryCount++;
    await usage.save();
  }

  // Prepare messages for the AI
  const contextMessages = (messages || []).map((msg) => ({
    role: msg.role,
    parts: msg.parts.map((part) => ({ text: part.text })),
  }));

  // Add the current user query
  contextMessages.push({ role: "user", parts: [{ text: query }] });

  try {
    // Initialize Gemini model
    const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Define the system prompt for HeritageX
    const systemPrompt =
      "HeritageX is an AI assistant developed for the Maha-Heritage Project, dedicated to sharing accurate and insightful information about heritage, history, and culture, with a special focus on Maharashtra and India’s rich cultural legacy. It exclusively responds to topics related to monuments, architecture, historical events, art, traditions, folklore, festivals, and cultural practices. If asked about anything beyond these subjects, HeritageX will politely decline by saying, “I’m sorry, but I can only answer questions related to heritage, history, or culture as part of the Maha-Heritage project.” It always communicates in an informative, respectful, and culturally aware manner.";

    // Combine system prompt with conversation context
    const inputText = `${systemPrompt}\n\nUser: ${query}`;

    // Generate AI response
    const result = await model.generateContent(inputText);
    const aiText =
      result.response.text() ||
      "I had trouble generating a response. Please try again.";

    // Save chat history if user is logged in
    let currentChatId = chatId;
    if (user) {
      let chat;
      if (currentChatId) {
        chat = await Chat.findById(currentChatId);
      } else {
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
    return NextResponse.json(
      { error: "Failed to get response from AI." },
      { status: 500 }
    );
  }
}
