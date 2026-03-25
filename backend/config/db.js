const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Using Database: ${conn.connection.db.databaseName}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Check if the URI is still a placeholder
    if (process.env.MONGO_URI.includes('<username>')) {
      console.warn('⚠️  It looks like you still have placeholders in your MONGO_URI in the .env file.');
    }
    process.exit(1);
  }
};

module.exports = connectDB;

