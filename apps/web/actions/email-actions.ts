"use server";

import { EmailTemplate } from "@/components/email-template";
import { resend } from "@/lib/resend";

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
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY environment variable is not set");
  }
  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM environment variable is not set");
  }

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: [to.toLowerCase().trim()], // Resend expects an array
      subject: subject.trim(),
      react: EmailTemplate({ username, linkUrl, text, buttonText }),
    });

    return {
      success: true,
    };
  } catch (error: unknown) {
    console.error("Error sending email:", error);

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to send email. Please try again later.",
    };
  }
}
