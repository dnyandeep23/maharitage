export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { withAuth } from "../../../../../../middleware/auth";
import Chat from "../../../../../../models/Chat";
import connectDB from "../../../../../../lib/mongoose.js";

const normalizeConfig = (body, existing = {}) => {
  const bodyConfig = body.config && typeof body.config === "object" ? body.config : {};
  return {
    topic: body.topic ?? bodyConfig.topic ?? existing.topic ?? existing.config?.topic ?? "",
    difficulty:
      body.difficulty ??
      bodyConfig.difficulty ??
      existing.difficulty ??
      existing.config?.difficulty ??
      "Medium",
    questionCount:
      body.questionCount ??
      bodyConfig.questionCount ??
      existing.questionCount ??
      existing.config?.questionCount ??
      (Array.isArray(body.questions) ? body.questions.length : 5),
    questionType:
      body.questionType ??
      bodyConfig.questionType ??
      existing.questionType ??
      existing.config?.questionType ??
      "MCQ",
  };
};

export async function PUT(request, context) {
  const authError = await withAuth(request);
  if (authError) return authError;

  await connectDB();

  try {
    const { params } = await context;
    const { id } = await params;
    const body = await request.json();

    const chat = await Chat.findById(id);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.userId.toString() !== request.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (chat.mode !== "quiz") {
      return NextResponse.json({ error: "Cannot save quiz state to a non-quiz chat" }, { status: 400 });
    }

    const previousState = chat.quizState || {};
    const config = normalizeConfig(body, previousState);
    const questions = body.questions || previousState.questions || [];
    const totalQuestions =
      body.totalQuestions ?? previousState.totalQuestions ?? questions.length;
    const score = body.score ?? previousState.score ?? 0;
    const answeredQuestions =
      body.answeredQuestions || previousState.answeredQuestions || [];
    const selectedAnswers =
      body.selectedAnswers || previousState.selectedAnswers || {};
    const answeredCount = Array.isArray(answeredQuestions)
      ? answeredQuestions.length
      : Object.keys(selectedAnswers || {}).length;
    const isComplete =
      body.status === "COMPLETED" ||
      body.isComplete === true ||
      body.completed === true ||
      previousState.status === "COMPLETED" ||
      previousState.isComplete === true ||
      (totalQuestions > 0 && answeredCount >= totalQuestions);
    const status = isComplete
      ? "COMPLETED"
      : questions.length > 0
        ? "IN_PROGRESS"
        : (body.status || previousState.status || "NOT_STARTED");
    const completedAt =
      status === "COMPLETED"
        ? body.completedAt || previousState.completedAt || new Date()
        : null;
    const accuracy =
      body.accuracy ??
      (totalQuestions ? Math.round((score / totalQuestions) * 100) : 0);
    const currentQuestionIndex =
      body.currentQuestionIndex ??
      body.currentIndex ??
      previousState.currentQuestionIndex ??
      previousState.currentIndex ??
      0;

    const previousPlainState = previousState.toObject?.() ?? previousState;

    chat.quizState = {
      ...previousPlainState,
      ...config,
      questions,
      currentQuestionIndex,
      currentIndex: currentQuestionIndex,
      answeredQuestions,
      selectedAnswers,
      score,
      totalQuestions,
      accuracy,
      xp: body.xp ?? previousState.xp ?? score * 10,
      isComplete: status === "COMPLETED",
      status,
      completedAt,
      config,
    };

    // Auto-update title if it's currently "New Chat" or "New Quiz"
    if (config.topic && (chat.title === "New Chat" || chat.title === "New Quiz")) {
        chat.title = `Quiz: ${config.topic.substring(0, 30)}${config.topic.length > 30 ? '...' : ''}`;
    }

    await chat.save();

    return NextResponse.json({ success: true, quizState: chat.quizState });
  } catch (error) {
    console.error("Error saving quiz state:", error);
    return NextResponse.json({ error: "Error saving quiz state" }, { status: 500 });
  }
}
