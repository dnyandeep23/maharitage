import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key');
const JWT_EXPIRES_IN = '7d';
const EMAIL_VERIFICATION_EXPIRES_IN = '1d';
const PASSWORD_RESET_EXPIRES_IN = '1d';

// Helper to convert time strings (e.g., "7d", "1h") to seconds
const getExpirationSeconds = (timeString) => {
  const value = parseInt(timeString.slice(0, -1));
  const unit = timeString.slice(-1);

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60;
    case 'h':
      return value * 60 * 60;
    case 'm':
      return value * 60;
    default:
      return value;
  }
};

// ✅ Generate Auth Token
export const generateToken = async (user) => {
  const expiresInSec = getExpirationSeconds(JWT_EXPIRES_IN);

  return await new SignJWT({
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSec)
    .setIssuedAt()
    .sign(JWT_SECRET);
};

// ✅ Generate Email Verification Token
export const generateVerificationToken = async (user) => {
  const expiresInSec = getExpirationSeconds(EMAIL_VERIFICATION_EXPIRES_IN);

  return await new SignJWT({ id: user._id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSec)
    .setIssuedAt()
    .sign(JWT_SECRET);
};

// ✅ Generate Password Reset Token
export const generatePasswordResetToken = async (user) => {
  const expiresInSec = getExpirationSeconds(PASSWORD_RESET_EXPIRES_IN);

  return await new SignJWT({ id: user._id.toString(), email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSec)
    .setIssuedAt()
    .sign(JWT_SECRET);
};

// ✅ Verify Token
export const verifyToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return null;
  }
};

// ✅ Extract Token from Request Headers
export const getTokenFromHeader = (req) => {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

// ✅ Verify Token for Middleware
export const verifyTokenMiddleware = async (token) => {
  if (!token) {
    return null;
  }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    console.log('Middleware Token Payload:', payload);
    return payload; // Token is valid
  } catch (error) {
    console.error('Middleware Token Verification Error:', error.message);
    return null; // Token is invalid or expired
  }
};

export const getUserIdFromToken = async (token) => {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.id;
  } catch (error) {
    console.error('JWT Verification Error:', error.message);
    return null;
  }
};