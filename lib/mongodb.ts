import { MongoClient, Db } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to environment variables");
}

const uri = process.env.MONGODB_URI;

// Validate MongoDB URI format
if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
  throw new Error("Invalid MongoDB URI format");
}

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  authSource: "admin",
  ssl: true
};

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getDatabase(): Promise<Db> {
  // Return cached connection if available and healthy
  if (cachedClient && cachedDb) {
    try {
      await cachedClient.db("admin").command({ ping: 1 });
      return cachedDb;
    } catch (error) {
      console.warn("Cached connection failed, creating new connection");
      cachedClient = null;
      cachedDb = null;
    }
  }

  try {
    const client = new MongoClient(uri, options);
    await client.connect();
    await client.db("admin").command({ ping: 1 });

    cachedClient = client;
    cachedDb = client.db("expenses-app");

    return cachedDb;
  } catch (error) {
    console.error("Database connection error:", error);
    throw new Error(
      `Database connection failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function closeConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
