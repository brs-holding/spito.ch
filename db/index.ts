import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@db/schema";
import { sql } from 'drizzle-orm';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure database with SSL and better error handling
const db = drizzle({
  connectionString: process.env.DATABASE_URL,
  schema,
  ws: ws,
  ssl: true,
});

// Test database connection function
export async function testDatabaseConnection() {
  try {
    // Attempt a simple query to verify connection
    const result = await db.execute(sql`SELECT 1`);
    console.log("Database connection successful");
    return true;
  } catch (error) {
    console.error("Database connection failed:", error);
    throw error;
  }
}

// Original initializeDatabase function (keeping for potential future use or modification)
export async function initializeDatabase() {
  try {
    console.log('Initializing database connection...');    
    // Test the connection
    await db.execute(sql`SELECT 1`);
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

export { db };