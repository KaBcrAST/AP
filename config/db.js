const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.COSMOS_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDb;
