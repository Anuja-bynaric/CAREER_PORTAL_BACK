import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',      // Path to your schema file
  out: './drizzle',                 // Where migrations will be stored
  dialect: 'postgresql',            // Database dialect
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Your Connection String
  },
});