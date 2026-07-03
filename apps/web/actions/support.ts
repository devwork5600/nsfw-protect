'use server';

import * as React from 'react';
import { sendEmail, SupportRequestTemplate } from '@nsfw/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitSupportRequest(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim();
  const subject = String(formData.get('subject') ?? '').trim();
  const message = String(formData.get('message') ?? '').trim();

  if (!name || !email || !subject || !message) {
    return { success: false, message: 'Please fill in all required fields.' };
  }

  if (!EMAIL_RE.test(email)) {
    return { success: false, message: 'Please enter a valid email address.' };
  }

  if (message.length > 5000) {
    return { success: false, message: 'Message is too long (max 5000 characters).' };
  }

  const supportEmail = process.env.SUPPORT_EMAIL || 'support@nsfw-protect.com';

  const result = await sendEmail({
    to: supportEmail,
    subject: `[Support] ${subject}`,
    react: React.createElement(SupportRequestTemplate, {
      name,
      email,
      category: category || 'General Question',
      subject,
      message,
    }),
    replyTo: email,
  });

  if (!result.success) {
    return { success: false, message: 'Failed to send your message. Please try again later.' };
  }

  return { success: true, message: "Thanks — we've received your message and will reply soon." };
}
