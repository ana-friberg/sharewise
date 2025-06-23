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
  
  let db;
  try {
    db = await getDatabase();

    const expenses = await db
      .collection<Expense>('expenses-data')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    return NextResponse.json({ expenses });
    
  } catch (error) {
    console.error('GET /api/expenses - Error occurred:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    // Handle specific MongoDB errors
    if (error instanceof Error) {
      if (error.message.includes('Topology is closed') || 
          error.message.includes('ENOTFOUND') || 
          error.message.includes('ECONNREFUSED')) {
        
        // Retry once with fresh connection
        try {
          db = await getDatabase();
          const expenses = await db
            .collection<Expense>('expenses-data')
            .find({})
            .sort({ createdAt: -1 })
            .toArray();
          
          return NextResponse.json({ expenses });
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          return NextResponse.json(
            { error: 'Service temporarily unavailable' },
            { status: 503 }
          );
        }
      }
      
      if (error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 401 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST - Add new expense
export async function POST(request: NextRequest) {
  
  let db;
  try {
    const body = await request.json();
    
    const { description, amount, category, person, storeName, date } = body;

    // Validation
    if (!amount || !storeName) {
      return NextResponse.json(
        { error: 'Amount and store name are required' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
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

    
    db = await getDatabase();
    const result = await db.collection<Expense>('expenses-data').insertOne(expense);
    
    return NextResponse.json({
      expense: { ...expense, _id: result.insertedId.toString() }
    }, { status: 201 });
    
  } catch (error) {
    console.error('POST /api/expenses - Error occurred:', error);
    
    // Handle specific MongoDB errors with retry logic
    if (error instanceof Error && 
        (error.message.includes('Topology is closed') || 
         error.message.includes('ENOTFOUND') || 
         error.message.includes('ECONNREFUSED'))) {
      
      try {
        // Parse request body again for retry
        const body = await request.json();
        const { description, amount, category, person, storeName, date } = body;
        
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
        
        db = await getDatabase();
        const result = await db.collection<Expense>('expenses-data').insertOne(expense);
        return NextResponse.json({
          expense: { ...expense, _id: result.insertedId.toString() }
        }, { status: 201 });
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to add expense' },
      { status: 500 }
    );
  }
}

// DELETE - Delete expense
export async function DELETE(request: NextRequest) {
  
  let db;
  try {
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('id');


    if (!expenseId) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    const numericId = parseInt(expenseId);
    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: 'Invalid expense ID format' },
        { status: 400 }
      );
    }


    db = await getDatabase();
    const result = await db
      .collection('expenses-data')
      .deleteOne({ id: numericId });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('DELETE /api/expenses - Error occurred:', error);
    
    // Handle connection errors with retry
    if (error instanceof Error && 
        (error.message.includes('Topology is closed') || 
         error.message.includes('ENOTFOUND') || 
         error.message.includes('ECONNREFUSED'))) {
      
      try {
        const { searchParams } = new URL(request.url);
        const expenseId = searchParams.get('id');
        const numericId = parseInt(expenseId!);
        
        db = await getDatabase();
        const result = await db
          .collection('expenses-data')
          .deleteOne({ id: numericId });
        
        if (result.deletedCount === 0) {
          return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
        }
        
        return NextResponse.json({ success: true });
      } catch (retryError) {
        console.error('Delete retry failed:', retryError);
        return NextResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}