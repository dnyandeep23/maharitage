import { NextResponse } from "next/server";
import { withAuth } from "../../../../middleware/auth";
import Chat from "../../../../models/Chat";
import connectDB from "../../../../lib/mongoose.js";

export async function GET(request) {
  const authError = await withAuth(request);
  if (authError) return authError;

  await connectDB();
  try {
    const chats = await Chat.find({ userId: request.user.id }).sort({
      createdAt: -1,
    });

    return NextResponse.json({ chats });
  } catch (error) {
    return NextResponse.json(
      { error: "Error fetching chats" },
      { status: 500 }
    );
  }
}
