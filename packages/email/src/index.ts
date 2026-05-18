import { Resend } from 'resend';
import { EmailTemplate } from './template.tsx';
import * as React from 'react';

let _resend: Resend | null = null;

function getResend() {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export async function sendEmail({
  to,
  username,
  subject,
  text,
  buttonText,
  linkUrl,
}: {
  to: string;
  username: string;
  subject: string;
  text: string;
  buttonText: string;
  linkUrl: string;
}) {
  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error('EMAIL_FROM environment variable is not set');
  }

  try {
    const resendClient = getResend();
    await resendClient.emails.send({
      from,
      to: [to.toLowerCase().trim()],
      subject: subject.trim(),
      react: React.createElement(EmailTemplate, { username, linkUrl, text, buttonText }),
    });

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error('Error sending email:', error);

    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Failed to send email. Please try again later.',
    };
  }
}

export * from './template.tsx';
export { getResend as resend };
