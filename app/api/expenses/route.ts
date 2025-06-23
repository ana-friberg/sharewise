import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export interface Expense {
  _id?: string;
  id: number;
  description: string;
  amount: number;
  category: string;
  person: string;
  storeName: string;
  date: string;
  createdAt?: Date;
}

// GET - Fetch all expenses
export async function GET() {
  console.log('GET /api/expenses - Request started');
  
  try {
    console.log('Getting database connection...');
    const db = await getDatabase();
    console.log('Database connection successful');
    
    const expenses = await db
      .collection<Expense>('expenses-data')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`Successfully fetched ${expenses.length} expenses`);
    return NextResponse.json({ expenses });
    
  } catch (error) {
    console.error('GET /api/expenses - Error occurred:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST - Add new expense
export async function POST(request: NextRequest) {
  console.log('POST /api/expenses - Request started');
  
  try {
    const body = await request.json();
    console.log('Request body:', body);
    
    const { description, amount, category, person, storeName, date } = body;

    // Validation
    if (!amount || !storeName) {
      console.log('Validation failed: missing required fields');
      return NextResponse.json(
        { error: 'Amount and store name are required' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      console.log('Validation failed: invalid amount');
      return NextResponse.json(
        { error: 'Amount must be a valid positive number' },
        { status: 400 }
      );
    }

    const expense: Expense = {
      id: Date.now(),
      description: description?.trim() || '',
      amount: parseFloat(amount),
      category: category || 'other',
      person: person || 'ana',
      storeName: storeName.trim(),
      date: date || new Date().toLocaleDateString('en-GB'),
      createdAt: new Date()
    };

    console.log('Created expense object:', expense);
    
    const db = await getDatabase();
    console.log('Database connection successful');
    
    const result = await db.collection<Expense>('expenses-data').insertOne(expense);
    console.log('Expense inserted successfully');
    
    return NextResponse.json({
      expense: { ...expense, _id: result.insertedId.toString() }
    }, { status: 201 });
    
  } catch (error) {
    console.error('POST /api/expenses - Error occurred:', error);
    return NextResponse.json(
      { error: 'Failed to add expense' },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(request: NextRequest) {
  console.log('DELETE /api/expenses - Request started');
  
  try {
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');
    console.log('Delete request for expense ID:', expenseId);

    if (!expenseId) {
      console.log('Validation failed: missing expense ID');
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const numericId = parseInt(expenseId);
    if (isNaN(numericId)) {
      console.log('Validation failed: invalid expense ID format');
      return NextResponse.json(
        { error: 'Invalid expense ID format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    console.log('Database connection successful');
    
    const result = await db
      .collection('expenses-data')
      .deleteOne({ id: numericId });

    console.log('Delete operation completed. Deleted count:', result.deletedCount);

    if (result.deletedCount === 0) {
      console.log('No expense found with the given ID');
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('DELETE /api/expenses - Error occurred:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}