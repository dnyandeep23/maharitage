import { NextResponse } from 'next/server';
import { withAuth } from '../../../../middleware/auth';
import User from '../../../../models/User';

export async function PUT(request) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const { preferences } = await request.json();

    const user = await User.findByIdAndUpdate(
      request.user.id,
      {
        'profile.preferences': preferences,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user.profile.preferences
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error updating user preferences'
    }, { status: 500 });
  }
}

export async function GET(request) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const user = await User.findById(request.user.id)
      .select('profile.preferences')
      .lean();

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user.profile.preferences
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error fetching user preferences'
    }, { status: 500 });
  }
}