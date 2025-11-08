import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongoose";
import User from "../../../../models/User";

import { adminAuth } from '../../../../middleware/adminAuth';

async function deleteAdmin(request, { params }) {
  await connectDB();
  const { id } = params;

  try {
    if (id === '68f89e38ca0c300f586e70fd') {
      return NextResponse.json({ message: 'Cannot remove superadmin role' }, { status: 403 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    user.role = 'public-user';
    await user.save();

    return NextResponse.json({ message: 'Admin role removed successfully' });
  } catch (error) {
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export const DELETE = adminAuth(deleteAdmin);
