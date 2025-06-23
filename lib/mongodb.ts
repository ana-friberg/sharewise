import { MongoClient, Db, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to environment variables');
}

const uri = process.env.MONGODB_URI;

// Simplified options for development
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
};

let client: MongoClient | null = null;

export async function getDatabase(): Promise<Db> {
  try {
    if (!client) {
      console.log('Creating new MongoDB client...');
      client = new MongoClient(uri, options);
      await client.connect();
      console.log('Connected to MongoDB');
    }
    
    return client.db('expenses-app');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}