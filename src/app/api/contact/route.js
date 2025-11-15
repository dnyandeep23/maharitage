import { sendEmail } from '@/lib/email';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const emailTo = process.env.EMAIL_FROM;
    const subject = `New message from ${name} on Maharitage`;
    const text = `Name: ${name}
Email: ${email}
Message: ${message}`;
    const html = `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Message:</strong> ${message}</p>`;

    await sendEmail({ to: emailTo, subject, text, html });

    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
