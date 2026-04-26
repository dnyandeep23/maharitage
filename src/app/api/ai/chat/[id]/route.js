import { NextResponse } from "next/server";
import { withAuth } from "../../../../../middleware/auth";
import Chat from "../../../../../models/Chat";
import connectDB from "../../../../../lib/mongoose.js";

export async function GET(request, context) {
  const authError = await withAuth(request);
  if (authError) return authError;

  await connectDB();

  try {
    const { params } = await context;
    const { id } = await params;
    const chat = await Chat.findById(id);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.userId.toString() !== request.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      messages: chat.messages,
      chat: {
        _id: chat._id,
        title: chat.title,
        mode: chat.mode,
        audienceType: chat.audienceType,
        score: chat.score,
        progress: chat.progress,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Error fetching chat" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const authError = await withAuth(request);
  if (authError) return authError;

  await connectDB();

  try {
    const { params } = await context;
    const { id } = await params;
    const chat = await Chat.findById(id);

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 });
    }

    if (chat.userId.toString() !== request.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await Chat.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Error deleting chat" }, { status: 500 });
  }
}
