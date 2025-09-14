import { NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from '../lib/jwt.js';

export async function withAuth(req) {
  const token = getTokenFromHeader(req);
  
  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'Authentication required'
    }, { status: 401 });
  }

  const user = verifyToken(token);
  if (!user) {
    return NextResponse.json({
      success: false,
      error: 'Invalid or expired token'
    }, { status: 401 });
  }

  req.user = user;
  return null;
}

export function handleApiError(error) {
  console.error('API Error:', error.toString());

  // Default error response
  const response = {
    success: false,
    error: 'Server error',
    message: error.message || 'An unexpected error occurred'
  };

  // Handle Mongoose Validation Errors
  if (error.name === 'ValidationError') {
    const validationErrors = {};
    
    // Collect all validation errors
    Object.keys(error.errors).forEach(key => {
      validationErrors[key] = error.errors[key].message;
    });

    return NextResponse.json({
      success: false,
      error: 'Validation error',
      errors: validationErrors,
      message: 'Please check your input and try again'
    }, { status: 400 });
  }

  // Handle Duplicate Key Errors (e.g., unique email/username)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return NextResponse.json({
      success: false,
      error: 'Duplicate error',
      field: field,
      message: `This ${field} is already registered`
    }, { status: 400 });
  }

  // Handle other specific MongoDB/Mongoose errors
  if (error.name === 'CastError') {
    return NextResponse.json({
      success: false,
      error: 'Invalid input',
      message: 'One or more fields have invalid data'
    }, { status: 400 });
  }

  // Return generic error for unhandled cases
  return NextResponse.json(response, { status: 500 });
}