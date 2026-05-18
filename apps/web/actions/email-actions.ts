'use server';

import { sendEmail as sharedSendEmail } from '@nsfw/email';

export async function sendEmail(params: Parameters<typeof sharedSendEmail>[0]) {
  return sharedSendEmail(params);
}
