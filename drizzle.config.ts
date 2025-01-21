import { defineConfig } from "drizzle-kit";
import { connectionString } from "pg-connection-string";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const config = connectionString(process.env.DATABASE_URL);

export default defineConfig({
  out: "./migrations",
  schema: "./db/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
    ssl: true
  }
});