import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    throw new Error(
        'Please define the MONGODB_URI environment variable inside .env.local'
    );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        console.log("[DB] Using cached connection");
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000,
        };

        console.log("[DB] Connecting to MongoDB...");

        cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
            console.log("[DB] Connected Successfully");
            return mongoose;
        }).catch((err) => {
            console.error("[DB] Connection Promise Error:", err.message);
            throw err;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("[DB] Connection Await Error:", e.message);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
