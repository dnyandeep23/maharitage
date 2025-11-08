import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,       // smtp-relay.brevo.com
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,                      // use STARTTLS (Brevo’s standard)
  auth: {
    user: process.env.EMAIL_USER,     // your Brevo account email
    pass: process.env.EMAIL_PASSWORD, // your Brevo SMTP key
  },
  tls: {
    rejectUnauthorized: true,         // verify TLS certificate
  },
});

export async function sendEmail({ to, subject, text, html }) {
  try {
    const mailOptions = {
      from: `Maharitage <${process.env.EMAIL_FROM}`,
      replyTo: process.env.EMAIL_REPLY_TO,
      to,
      subject,
      text,
      html: `
        ${html}
        <p style="font-size:12px;color:#888;">Sent via Brevo • ${new Date().toLocaleString()}</p>
      `,
      headers: {
        'X-Mailer': 'Nodemailer via Brevo',
        'X-Priority': '1',        // high importance
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      },
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    throw new Error(`Error sending email: ${error.message}`);
  }
}

// Template for verification email
export function getVerificationEmailTemplate(name, verificationUrl) {
  return {
    subject: 'Verify Your Email Address',
    text: `Hi ${name},\n\nPlease click the following link to verify your email address: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, you can safely ignore this email.`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
        <h1 style="font-family: 'Cinzel Decorative', cursive; color: #2E7D32; text-align: center;">MahaRitage</h1>
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2>Verify Your Email Address</h2>
          <p>Hi ${name},</p>
          <p>Please click the following link to verify your email address:</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Verify Email
            </a>
          </p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </div>
    `
  };
}

export async function sendNewAdminEmail(to, username, temporaryPassword) {
  const subject = 'Your new admin account on Maharitage';
  const text = `Hello ${username},\n\nAn admin account has been created for you on Maharitage.\n\nYour temporary password is: ${temporaryPassword}\n\nPlease log in and change your password as soon as possible.\n\nThank you,\nThe Maharitage Team`;
  const html = `
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
      <h1 style="font-family: 'Cinzel Decorative', cursive; color: #2E7D32; text-align: center;">MahaRitage</h1>
      <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
        <h2>Welcome to the Maharitage Admin Team!</h2>
        <p>Hi ${username},</p>
        <p>An admin account has been created for you on Maharitage.</p>
        <p>Your temporary password is: <strong>${temporaryPassword}</strong></p>
        <p>Please log in and change your password as soon as possible.</p>
        <p>Thank you,<br/>The Maharitage Team</p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, text, html });
}// Template for password reset email
export function getPasswordResetEmailTemplate(name, resetUrl) {
  return {
    subject: 'Reset Your Password',
    text: `Hi ${name},\n\nYou requested to reset your password. Click the following link to reset it: ${resetUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this, you can safely ignore this email.`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; color: #333;">
        <h1 style="font-family: 'Cinzel Decorative', cursive; color: #2E7D32; text-align: center;">MahaRitage</h1>
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2>Reset Your Password</h2>
          <p>Hi ${name},</p>
          <p>You requested to reset your password. Click the following link to reset it:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-size: 16px;">
              Reset Password
            </a>
          </p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `
  };
}
