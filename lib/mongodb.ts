import { MongoClient, Db, ServerApiVersion } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to environment variables');
}

const uri = process.env.MONGODB_URI;

// Serverless and SSL-optimized options for Vercel
const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // SSL/TLS Configuration for Vercel compatibility
  tls: true,
  tlsInsecure: false,
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
  
  // Connection pool settings for serverless
  maxPoolSize: 1,
  minPoolSize: 0,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  
  // Retry and reliability settings
  retryWrites: true,
  retryReads: true,
  w: 'majority' as const,
  
  // Additional options for serverless environments
  bufferMaxEntries: 0,
  useUnifiedTopology: true,
  
  // Force IPv4 to avoid IPv6 issues on some platforms
  family: 4,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Different approach for development vs production
if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

export async function getDatabase(): Promise<Db> {
  try {
    console.log('Getting database connection...');
    
    if (process.env.NODE_ENV === 'production') {
      console.log('Production mode: Creating fresh MongoDB connection');
      
      // Create a fresh client with timeout wrapper
      const freshClient = new MongoClient(uri, options);
      
      // Wrap connection with timeout
      const connectWithTimeout = Promise.race([
        freshClient.connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout after 15 seconds')), 15000)
        )
      ]);
      
      await connectWithTimeout;
      console.log('MongoDB connection established');
      
      // Test connection with ping
      await Promise.race([
        freshClient.db('admin').command({ ping: 1 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Ping timeout after 5 seconds')), 5000)
        )
      ]);
      
      console.log('MongoDB ping successful');
      return freshClient.db('expenses-app');
    } else {
      // Development mode - use cached connection
      console.log('Development mode: Using cached connection');
      const client = await clientPromise;
      
      // Test if connection is still alive
      try {
        await client.db('admin').command({ ping: 1 });
      } catch (pingError) {
        console.log('Connection lost, reconnecting...');
        await client.connect();
      }
      
      return client.db('expenses-app');
    }
  } catch (error) {
    console.error('Database connection error:', error);
    
    // Enhanced error handling for SSL issues
    if (error instanceof Error) {
      if (error.message.includes('SSL') || 
          error.message.includes('TLS') || 
          error.message.includes('ssl') ||
          error.message.includes('tls')) {
        console.error('SSL/TLS connection error detected');
        throw new Error('SSL connection to database failed. Please check MongoDB Atlas configuration.');
      }
      
      if (error.message.includes('timeout')) {
        console.error('Connection timeout detected');
        throw new Error('Database connection timeout. Service may be temporarily unavailable.');
      }
    }
    
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}