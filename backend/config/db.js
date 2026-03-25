const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📂 Using Database: ${conn.connection.db.databaseName}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    
    // Check if the URI is missing or still a placeholder
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MONGO_URI is missing! Please add it to your Render Environment Variables.');
    } else if (uri.includes('<username>')) {
      console.warn('⚠️  It looks like you still have placeholders in your MONGO_URI in the .env file.');
    }
    process.exit(1);
  }
};


module.exports = connectDB;

