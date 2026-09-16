function baseUrl(): string {
  const rawBaseUrl =
    process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://nsfw-protect.com';

  return rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
}

export function shieldUrl(): string {
  return `${baseUrl()}/shield-email.png`;
}
