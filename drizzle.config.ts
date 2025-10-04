import * as dotenv from "dotenv";
import { defineConfig } from 'drizzle-kit';


dotenv.config({ path: ".env.local" });

console.log("Loaded DB URL:", process.env.DATABASE_URL); 


export default defineConfig({
  out: './drizzle',
  schema: './config/userSchema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
