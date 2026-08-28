const mongoose = require('mongoose');

let isConnected = false;

/**
 * Ensures MongoDB connection is established and cached across requests/cold starts.
 */
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('ERROR: MONGODB_URI environment variable is missing.');
    throw new Error('MONGODB_URI is not defined in environment variables.');
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000,
    });

    isConnected = conn.connections[0].readyState === 1;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    isConnected = false;
    throw error;
  }
};

/**
 * Express middleware to guarantee DB connection before executing API handlers.
 */
const ensureDbConnected = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection middleware failure:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please check server configuration and database credentials.'
    });
  }
};

module.exports = {
  connectDB,
  ensureDbConnected
};
