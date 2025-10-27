import { NextResponse } from 'next/server';
import { withAuth, handleApiError } from '../../../middleware/auth';
import User from '../../../../models/User';
import dbConnect from '../../../../lib/mongoose';

// ✅ GET /api/auth/settings
export async function GET(request) {
  try {
    await dbConnect();
    const authError = await withAuth(request);
    if (authError) return authError;

    const user = await User.findById(request.user.id)
      .select('profile.preferences')
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences fetched successfully',
      data: user.profile.preferences,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// ✅ PUT /api/auth/settings
export async function PUT(request) {
  try {
    await dbConnect();
    const authError = await withAuth(request);
    if (authError) return authError;

    const { preferences } = await request.json();

    const updatedUser = await User.findByIdAndUpdate(
      request.user.id,
      { 'profile.preferences': preferences, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: updatedUser.profile.preferences,
    });
  } catch (error) {
    return handleApiError(error);
  }
}