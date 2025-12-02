import mongoose from 'mongoose';
import dotenv from 'dotenv';  // ✅ Changed from require
import path from 'path';
import { fileURLToPath } from 'url';  // ✅ Needed for __dirname in ES modules

// ✅ ES modules don't have __dirname, so we create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log("Loaded ATLAS_URI:", process.env.ATLAS_URI);

const connectionString = process.env.MONGO_URI || process.env.ATLAS_URI || "";

const connectToDatabase = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(connectionString);
        console.log('✅ MongoDB connected successfully');
    } catch (e) {
        console.error('❌ Database connection error:', e);
        throw e;  // Re-throw to be caught in server.js
    }
}

export { connectToDatabase };