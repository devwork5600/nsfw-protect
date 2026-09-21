import { NextResponse } from 'next/server';

// TEMPORARY — diagnosing what shape Vercel's edge gives x-forwarded-for for this app,
// before wiring Better Auth's `advanced.ipAddress` config (its rate limiter falls back to
// ONE shared bucket across every visitor if it can't resolve a single trustworthy client
// IP — see getIPFromHeader in @better-auth/core). No secrets exposed. Remove once confirmed.
export async function GET(request: Request) {
  const h = request.headers;
  return NextResponse.json({
    xForwardedFor: h.get('x-forwarded-for'),
    xRealIp: h.get('x-real-ip'),
    xVercelForwardedFor: h.get('x-vercel-forwarded-for'),
    cfConnectingIp: h.get('cf-connecting-ip'),
  });
}
