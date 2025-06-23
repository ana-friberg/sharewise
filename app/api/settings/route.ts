import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  console.log('GET /api/settings - Request started');
  
  try {
    console.log('Attempting to get database...');
    const db = await getDatabase();
    console.log('Database connection successful');
    
    console.log('Querying expenses-settings collection...');
    const settings = await db
      .collection('expenses-settings')
      .findOne({ type: 'contribution' });
    
    if (!settings) {
      console.log('No settings found, returning defaults');
      // Return default settings if none exist
      return NextResponse.json({
        settings: {
          anaAmount: 765,
          husbandAmount: 935,
          totalBudget: 1700
        }
      });
    }
    
    console.log('Settings found:', settings);
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/settings - Error occurred:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      cause: (error as any)?.cause,
      code: (error as any)?.code
    });

    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log('Network connection error detected');
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }
      if (error.message.includes('authentication')) {
        console.log('Authentication error detected');
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('POST /api/settings - Request started');
  
  try {
    console.log('Parsing request body...');
    const body = await request.json();
    console.log('Request body:', body);
    
    const { anaAmount, husbandAmount, totalBudget } = body;

    // Validation
    if (anaAmount == null || husbandAmount == null) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Ana amount and husband amount are required' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(anaAmount)) || isNaN(parseFloat(husbandAmount))) {
      console.log('Validation failed: invalid amounts');
      return NextResponse.json(
        { error: 'Amounts must be valid numbers' },
        { status: 400 }
      );
    }

    const settingsData = {
      type: 'contribution',
      anaAmount: parseFloat(anaAmount),
      husbandAmount: parseFloat(husbandAmount),
      totalBudget: parseFloat(totalBudget) || (parseFloat(anaAmount) + parseFloat(husbandAmount)),
      updatedAt: new Date()
    };

    console.log('Created settings object:', settingsData);
    console.log('Attempting to get database...');
    
    const db = await getDatabase();
    console.log('Database connection successful');
    
    console.log('Upserting settings into expenses-settings collection...');
    const result = await db
      .collection('expenses-settings')
      .replaceOne(
        { type: 'contribution' },
        settingsData,
        { upsert: true }
      );
    
    console.log('Settings upserted successfully. Result:', result);
    
    return NextResponse.json({
      success: true,
      settings: {
        anaAmount: settingsData.anaAmount,
        husbandAmount: settingsData.husbandAmount,
        totalBudget: settingsData.totalBudget
      }
    });
  } catch (error) {
    console.error('POST /api/settings - Error occurred:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      cause: (error as any)?.cause,
      code: (error as any)?.code
    });

    if (error instanceof Error) {
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        console.log('Network connection error detected');
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }
      if (error.message.includes('authentication')) {
        console.log('Authentication error detected');
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}