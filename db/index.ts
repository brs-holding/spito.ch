import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from "@db/schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Configure PostgreSQL pool with SSL and better error handling
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for some PostgreSQL providers
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  retryDelay: 1000, // Time between retries
  maxRetries: 3 // Maximum number of retries
});

// Add error handler for the pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize drizzle with the pool
export const db = drizzle(pool, { schema });

// Test database connection function with retries
export async function testDatabaseConnection(retries = 3): Promise<boolean> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        console.log(`Database connection successful on attempt ${attempt}`);
        return true;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`Database connection attempt ${attempt} failed:`, error);
      if (attempt === retries) {
        throw error;
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  return false;
}

// Initialize database function
export async function initializeDatabase() {
  try {
    console.log('Initializing database connection...');    
    await testDatabaseConnection();
    return true;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}