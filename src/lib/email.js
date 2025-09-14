import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function sendEmail({ to, subject, text, html }) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email error:', error);
    throw new Error('Error sending email');
  }
}

// Template for verification email
export function getVerificationEmailTemplate(name, verificationUrl) {
  return {
    subject: 'Verify Your Email Address',
    text: `Hi ${name},\n\nPlease click the following link to verify your email address: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Verify Your Email Address</h2>
        <p>Hi ${name},</p>
        <p>Please click the following link to verify your email address:</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
        </p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `
  };
}

// Template for password reset email
export function getPasswordResetEmailTemplate(name, resetUrl) {
  return {
    subject: 'Reset Your Password',
    text: `Hi ${name},\n\nYou requested to reset your password. Click the following link to reset it: ${resetUrl}\n\nThis link will expire in 30 minutes.\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Reset Your Password</h2>
        <p>Hi ${name},</p>
        <p>You requested to reset your password. Click the following link to reset it:</p>
        <p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
        </p>
        <p>This link will expire in 30 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `
  };
}