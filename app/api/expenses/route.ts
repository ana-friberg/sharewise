import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

// CORS Headers
// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? (process.env.URL_DOMAIN || 'https://expenses-app-tau-sooty.vercel.app')
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Rate limiting
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

// Get client IP address
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

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// GET - Fetch all expenses
export async function GET(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const db = await getDatabase();
    const expenses = await db
      .collection('expenses-data')
      .find({})
      .sort({ id: -1 })
      .toArray();

    return NextResponse.json(
      { expenses },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('GET /api/expenses - Error occurred:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Add new expense
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const body = await request.json();
    const { description, amount, category, person, storeName, date } = body;

    // Basic validation
    if (!amount || !storeName || !category || !person) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400, headers: corsHeaders }
      );
    }

    const expense = {
      id: Date.now(),
      description: description?.trim() || '',
      amount: parseFloat(amount),
      category,
      person,
      storeName: storeName.trim(),
      date,
      createdAt: new Date()
    };

    const db = await getDatabase();
    const result = await db.collection('expenses-data').insertOne(expense);
    
    return NextResponse.json(
      { expense: { ...expense, _id: result.insertedId.toString() } },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error('POST /api/expenses - Error occurred:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(request: NextRequest) {
  const clientIP = getClientIP(request);
  
  // Check rate limit
  if (!checkRateLimit(clientIP)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers: corsHeaders }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');

    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const numericId = parseInt(expenseId);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: 'Invalid expense ID' },
        { status: 400, headers: corsHeaders }
      );
    }

    const db = await getDatabase();
    const result = await db
      .collection('expenses-data')
      .deleteOne({ id: numericId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('DELETE /api/expenses - Error occurred:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}