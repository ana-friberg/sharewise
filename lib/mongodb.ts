import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to environment variables");
}

const uri = process.env.MONGODB_URI;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDatabase(): Promise<Db> {
  // Return cached connection if available and healthy
  if (cachedClient && cachedDb) {
    try {
      await cachedClient.db("admin").command({ ping: 1 });
      return cachedDb;
    } catch (error) {
      // Reset cache if connection is dead
      cachedClient = null;
      cachedDb = null;
    }
  }

  // Create new connection
  const client = new MongoClient(uri);
  await client.connect();
  await client.db("admin").command({ ping: 1 });

  // Cache the connection
  cachedClient = client;
  cachedDb = client.db("expenses-app");

  return cachedDb;
}

export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
