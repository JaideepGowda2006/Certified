const mongoose = require('mongoose');

const connectDB = async (retries = 5, delayMs = 2000) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDemo = String(process.env.DEMO_MODE || '').toLowerCase() === 'true';
  const configuredMongoUri = process.env.MONGODB_URI;
  let mongoUri;

  if (configuredMongoUri) {
    mongoUri = configuredMongoUri;
  } else if (isProduction && !isDemo) {
    throw new Error('MONGODB_URI is not configured in environment variables.');
  } else {
    mongoUri = 'mongodb://127.0.0.1:27017/truecert';
    console.warn(
      'MONGODB_URI not set. Falling back to mongodb://127.0.0.1:27017/truecert for local development.',
    );
  }

  const isSrv = mongoUri.includes('mongodb+srv://');
  const hasDirectParam = mongoUri.includes('directConnection=');
  const connectOptions = {
    serverSelectionTimeoutMS: 5000,
    ...(isSrv || hasDirectParam ? {} : { directConnection: true }),
  };

  console.log(
    `[MongoDB] Connecting to ${mongoUri.replace(/\/\/.*@/, '//<auth>@')} (directConnection: ${connectOptions.directConnection ?? 'url-default'})`,
  );

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(mongoUri, connectOptions);
      console.log('MongoDB connected successfully.');
      return;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      console.warn(
        `[MongoDB] Connection attempt ${attempt}/${retries} failed (${err.message}). Retrying in ${delayMs / 1000}s...`,
      );
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
};

module.exports = connectDB;
