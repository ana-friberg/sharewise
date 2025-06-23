import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const settings = await db
      .collection('expenses-settings')
      .findOne({ type: 'contribution' });
    
    if (!settings) {
      return NextResponse.json({
        settings: {
          anaAmount: 765,
          husbandAmount: 935,
          totalBudget: 1700
        }
      });
    }
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/settings - Error occurred:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    // Return default settings on any error
    return NextResponse.json({
      settings: {
        anaAmount: 765,
        husbandAmount: 935,
        totalBudget: 1700
      }
    });
  }
}

export async function POST(request: NextRequest) {
  
  try {
    const body = await request.json();
    const { anaAmount, husbandAmount, totalBudget } = body;

    // Validation
    if (anaAmount == null || husbandAmount == null) {
      return NextResponse.json(
        { error: 'Ana amount and husband amount are required' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(anaAmount)) || isNaN(parseFloat(husbandAmount))) {

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

    try {
      const db = await getDatabase();
      const result = await db
        .collection('expenses-settings')
        .replaceOne(
          { type: 'contribution' },
          settingsData,
          { upsert: true }
        );
      
      return NextResponse.json({
        success: true,
        settings: {
          anaAmount: settingsData.anaAmount,
          husbandAmount: settingsData.husbandAmount,
          totalBudget: settingsData.totalBudget
        }
      });
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('POST /api/settings - Error occurred:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}