import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? (process.env.URL_DOMAIN || 'https://expenses-app-tau-sooty.vercel.app')
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Rate limiting (shared with expenses route)
const rateLimit = new Map();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  const limit = rateLimit.get(ip);
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + windowMs;
    return true;
  }

  if (limit.count >= maxRequests) {
    return false;
  }

  limit.count++;
  return true;
}

function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (remoteAddr) {
    return remoteAddr;
  }
  return 'unknown';
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const db = await getDatabase();
    const settings = await db
      .collection('settings-data')
      .findOne({ type: 'sharedAccount' });

    return NextResponse.json(
      { settings },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('GET /api/settings - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const { sharedAccountBalance } = body;

    // Validation
    if (typeof sharedAccountBalance !== 'number' || sharedAccountBalance < 0) {
      return NextResponse.json(
        { error: 'Invalid shared account balance value' },
        { status: 400, headers: corsHeaders }
      );
    }

    const settingsData = {
      type: 'sharedAccount',
      sharedAccountBalance,
      updatedAt: new Date()
    };

    const db = await getDatabase();
    await db
      .collection('settings-data')
      .updateOne(
        { type: 'sharedAccount' },
        { $set: settingsData },
        { upsert: true }
      );

    return NextResponse.json(
      { success: true, settings: settingsData },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('POST /api/settings - Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}