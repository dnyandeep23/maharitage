import { NextResponse } from "next/server";
import { withAuth } from "../../../../middleware/auth";
import Chat from "../../../../models/Chat";
import connectDB from "../../../../lib/mongoose.js";

export async function GET(request) {
  const authError = await withAuth(request);
  if (authError) return authError;

  await connectDB();
  try {
    const chats = await Chat.find({ userId: request.user.id })
      .select("title mode audienceType createdAt quizState.status quizState.isComplete quizState.score quizState.totalQuestions quizState.questions")
      .sort({ createdAt: -1 });

    const formattedChats = chats.map(c => {
       const chatObj = c.toObject();
       if (chatObj.mode === "quiz" && chatObj.quizState) {
           chatObj.quizStatus = chatObj.quizState.isComplete
             ? "COMPLETED"
             : (chatObj.quizState.status || "IN_PROGRESS");
           chatObj.score = chatObj.quizState.score || 0;
           chatObj.totalQuestions = chatObj.quizState.totalQuestions || (chatObj.quizState.questions ? chatObj.quizState.questions.length : 0);
           delete chatObj.quizState; // Keep payload lightweight for sidebar
       }
       return chatObj;
    });

    return NextResponse.json({ chats: formattedChats });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching chats" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  const authError = await withAuth(request);
  if (authError) return authError;

  await connectDB();
  try {
    const { mode, audienceType, title, config } = await request.json();
    const quizConfig = config && typeof config === "object" ? config : {};

    const newChat = new Chat({
      userId: request.user.id,
      mode: mode || "chat",
      audienceType: audienceType || "general",
      title: title || (mode === "quiz" ? "New Quiz" : "New Chat"),
      messages: [],
      ...(mode === "quiz"
        ? {
            quizState: {
              status: "NOT_STARTED",
              topic: quizConfig.topic || "",
              difficulty: quizConfig.difficulty || "Medium",
              questionCount: quizConfig.questionCount || 5,
              questionType: quizConfig.questionType || "MCQ",
              totalQuestions: 0,
              completedAt: null,
              config: quizConfig,
            },
          }
        : {}),
    });

    await newChat.save();

    return NextResponse.json({ success: true, chat: newChat });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Error creating chat" },
      { status: 500 }
    );
  }
}
