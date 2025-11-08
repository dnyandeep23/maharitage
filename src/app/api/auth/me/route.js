import { NextResponse } from 'next/server';
import { withAuth } from '../../../../middleware/auth';
import User from '../../../../models/User';
import connectDB from '../../../../lib/mongoose.js';
// Get current user profile
export async function GET(request) {

  const authError = await withAuth(request);
  if (authError) return authError;
  await connectDB();
  try {
    const user = await User.findById(request.user.id).select('-password');

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Error fetching user profile'
    }, { status: 500 });
  }
}

// Update user profile
export async function PUT(request) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const userData = await request.json();
    const allowedUpdates = ['name', 'profile'];

    // Filter out non-allowed updates
    const updates = Object.keys(userData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = userData[key];
        return obj;
      }, {});

    const user = await User.findByIdAndUpdate(
      request.user.id,
      {
        ...updates,
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
      data: user
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Error updating user profile'
    }, { status: 500 });
  }
}