import { NextRequest, NextResponse } from "next/server";
import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI environment variable is not defined");
}

const client = new MongoClient(uri);

interface ConversionEntry {
  _id?: ObjectId;
  id_name: string;
  store_name: string;
  category: string;
  comment?: string;
}

// GET - Retrieve conversion table or search by id_name
export async function GET(request: NextRequest) {
  try {
    await client.connect();
    const database = client.db("expenses-app");
    const collection = database.collection("storeConversions");
    
    const { searchParams } = new URL(request.url);
    const id_name = searchParams.get('id_name');
    
    if (id_name) {
      // Search for specific store by id_name (case insensitive)
      const entry = await collection.findOne({ 
        id_name: { $regex: new RegExp(id_name, 'i') } 
      });
      
      return NextResponse.json({ 
        success: true, 
        entry: entry || null 
      });
    } else {
      // Return all conversion entries
      const entries = await collection.find({}).toArray();
      return NextResponse.json({ 
        success: true, 
        entries 
      });
    }
  } catch (error) {
    console.error("Error fetching conversion table:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch conversion table" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// POST - Add new conversion entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id_name, store_name, category, comment } = body;

    if (!id_name || !store_name || !category) {
      return NextResponse.json(
        { success: false, error: "id_name, store_name, and category are required" },
        { status: 400 }
      );
    }

    await client.connect();
    const database = client.db("expenses-app");
    const collection = database.collection("storeConversions");

    const newEntry: ConversionEntry = {
      id_name: id_name.toLowerCase().trim(),
      store_name: store_name.trim(),
      category: category.trim(),
      comment: comment?.trim() || ""
    };

    const result = await collection.insertOne(newEntry);
    const insertedEntry = await collection.findOne({ _id: result.insertedId });

    return NextResponse.json({ 
      success: true, 
      entry: insertedEntry 
    });
  } catch (error) {
    console.error("Error adding conversion entry:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add conversion entry" },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
