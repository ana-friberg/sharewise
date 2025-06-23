import { MongoClient, Db, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to environment variables');
}

const uri = process.env.MONGODB_URI;

// Serverless-optimized options
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  maxPoolSize: 1, // Limit to 1 connection for serverless
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 3000,
  connectTimeoutMS: 5000,
  maxIdleTimeMS: 3000,
  retryWrites: true,
  w: 'majority' as const,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Different approach for development vs production
if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve the value across module reloads
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
  try {
    
    // For serverless, always create a fresh connection
    if (process.env.NODE_ENV === 'production') {
      const freshClient = new MongoClient(uri, options);
      await freshClient.connect();
      
      // Test connection
      await freshClient.db('admin').command({ ping: 1 });
      
      return freshClient.db('expenses-app');
    } else {
      // Development mode - use cached connection
      const client = await clientPromise;
      
      // Test if connection is still alive
      try {
        await client.db('admin').command({ ping: 1 });
      } catch (pingError) {
        await client.connect();
      }
      
      return client.db('expenses-app');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}