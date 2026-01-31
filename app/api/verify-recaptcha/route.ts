/**
 * API route to verify reCAPTCHA tokens
 * This runs on the backend to securely verify tokens with Google
 */

import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return Response.json(
        { success: false, error: 'No token provided' },
        { status: 400 }
      );
    }

    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      console.warn('RECAPTCHA_SECRET_KEY is not configured, skipping verification');
      return Response.json({ success: true, score: 1.0 });
    }

    // Verify token with Google
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    // reCAPTCHA v3 returns a score between 0.0 and 1.0
    // 1.0 is very likely a good interaction, 0.0 is very likely a bot
    // Typically, you'd reject if score < 0.5
    const isHuman = data.success && data.score > 0.5;

    return Response.json({
      success: data.success,
      score: data.score,
      action: data.action,
      challenge_ts: data.challenge_ts,
      hostname: data.hostname,
    });
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return Response.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}
