const mongoose = require('mongoose');

const connectDB = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const configuredMongoUri = process.env.MONGODB_URI;
  let mongoUri;

  if (configuredMongoUri) {
    mongoUri = configuredMongoUri;
  } else if (isProduction) {
    throw new Error('MONGODB_URI is not configured in environment variables.');
  } else {
    mongoUri = 'mongodb://127.0.0.1:27017/truecert';
    console.warn(
      'MONGODB_URI not set. Falling back to mongodb://127.0.0.1:27017/truecert for local development.',
    );
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected successfully.');
};

module.exports = connectDB;
