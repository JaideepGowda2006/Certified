require('dotenv').config();

const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const configureCloudinary = require('./config/cloudinary');
const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const sanitizeRequest = require('./middleware/sanitizeMiddleware');

const app = express();

const corsOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

app.set('trust proxy', 1);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: process.env.NODE_ENV === 'production',
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || corsOrigins.length === 0 || corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS policy does not allow this origin.'));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  }),
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 250,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true, limit: '12mb' }));
app.use(sanitizeRequest);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'TrueCert backend is healthy.',
    environment: process.env.NODE_ENV || 'development',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT) || 5000;

const ensureJwtSecret = () => {
  const secret = String(process.env.JWT_SECRET || '');
  const isProduction = process.env.NODE_ENV === 'production';

  if (secret.length >= 32) {
    return;
  }

  if (isProduction) {
    if (!secret) {
      throw new Error('JWT_SECRET is required.');
    }

    throw new Error('JWT_SECRET must be at least 32 characters for strong token security.');
  }

  process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn(
    'JWT_SECRET was missing or weak. Generated a temporary dev secret; set JWT_SECRET in backend/.env for stable sessions.',
  );
};

const startServer = async () => {
  ensureJwtSecret();

  await connectDB();
  configureCloudinary();

  app.listen(port, () => {
    console.log(`TrueCert backend listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start backend server:', error.message);
  process.exit(1);
});
