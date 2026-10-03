// Replace require with import
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export async function connectDB(): Promise<void> {
    try {
        // Fallback to empty string if MONGO_URI is undefined
        await mongoose.connect(process.env.MONGO_URI || ""); 
        console.log("Connected to DB");
    } catch (err) {
        console.error("Couldn't connect to DB", err);
        process.exit(1); // Optional: Stop server if DB fails
    }
}
