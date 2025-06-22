import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export interface ContributionSettings {
  _id?: string;
  anaPercentage: number;
  husbandPercentage: number;
  updatedAt?: Date;
}

// GET - Fetch contribution settings
export async function GET() {
  try {
    const db = await getDatabase();
    const settings = await db
      .collection<ContributionSettings>('settings')
      .findOne({});

    // Return default settings if none exist
    const defaultSettings: ContributionSettings = {
      anaPercentage: 45,
      husbandPercentage: 55
    };

    return NextResponse.json({ 
      settings: settings || defaultSettings 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Update contribution settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anaPercentage, husbandPercentage } = body;

    if (typeof anaPercentage !== 'number' || typeof husbandPercentage !== 'number') {
      return NextResponse.json(
        { error: 'Invalid percentage values' },
        { status: 400 }
      );
    }

    if (anaPercentage + husbandPercentage !== 100) {
      return NextResponse.json(
        { error: 'Percentages must add up to 100' },
        { status: 400 }
      );
    }

    const settings: ContributionSettings = {
      anaPercentage,
      husbandPercentage,
      updatedAt: new Date()
    };

    const db = await getDatabase();
    await db.collection<ContributionSettings>('settings').replaceOne(
      {},
      settings,
      { upsert: true }
    );

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}