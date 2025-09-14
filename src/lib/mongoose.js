import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  try {
    // If we have an existing connection, return it
    if (cached.conn) {
      return cached.conn;
    }

    // If we don't have a promise to connect yet, create one
    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        family: 4, // Use IPv4, skip trying IPv6
      };

      cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    // Wait for the connection
    cached.conn = await cached.promise;

    // Add connection error handler
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      cached.promise = null;
      cached.conn = null;
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    // Reset the promise and connection on error
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

// Export both the connection function and mongoose instance
export { connectDB as default, mongoose };