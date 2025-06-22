import { MongoClient, Db, ServerApiVersion } from 'mongodb';

// Debug: Log environment variables
console.log('Environment check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI:', process.env.MONGODB_URI);

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;

// MongoDB Client Options with Stable API
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  retryWrites: true,
  w: 'majority' as const,
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  heartbeatFrequencyMS: 10000,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Production-only connection handling
console.log('Creating MongoDB client with Stable API...');
client = new MongoClient(uri, options);
clientPromise = client.connect();

export default clientPromise;

export async function getDatabase(): Promise<Db> {
  try {
    console.log('Attempting to get database connection...');
    const client = await clientPromise;
    console.log('MongoDB client connected successfully');
    
    // Test connection with ping
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged deployment. Successfully connected to MongoDB!");
    
    const db = client.db('expenses-app');
    console.log('Database selected: expenses-app');
    
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function closeConnection(): Promise<void> {
  try {
    const client = await clientPromise;
    await client.close();
    console.log('MongoDB connection closed');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
}