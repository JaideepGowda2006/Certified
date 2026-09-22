require('dotenv').config();

const crypto = require('node:crypto');
const http = require('node:http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const configureCloudinary = require('./config/cloudinary');
const { initSocket } = require('./utils/socket');
const authRoutes = require('./routes/authRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const sanitizeRequest = require('./middleware/sanitizeMiddleware');

const app = express();

const defaultAllowedOrigins = [
  'https://hoppscotch.io',
  'https://web.postman.co',
  'http://localhost:5173',
  'http://localhost:3000',
];

const envOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const corsOrigins = [...new Set([...defaultAllowedOrigins, ...envOrigins])];

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
      if (
        !origin ||
        corsOrigins.includes(origin) ||
        origin.endsWith('.hoppscotch.io') ||
        origin.endsWith('.vercel.app')
      ) {
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

app.get('/', (req, res) => {
  if (req.accepts('html')) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Certified Backend - Docker Node</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card: #151c2e;
      --border: #232f4e;
      --text: #e2e8f0;
      --text-muted: #94a3b8;
      --primary: #38bdf8;
      --success: #22c55e;
      --accent: #818cf8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .container { max-width: 680px; width: 100%; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 36px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
    .header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; }
    .logo { width: 44px; height: 44px; border-radius: 10px; background: linear-gradient(135deg, var(--primary), var(--accent)); display: flex; align-items: center; justify-content: center; font-size: 22px; }
    h1 { font-size: 24px; font-weight: 700; color: #fff; }
    p.subtitle { color: var(--text-muted); font-size: 14px; margin-top: 2px; }
    .status-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: var(--success); padding: 6px 14px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 24px; }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--success); box-shadow: 0 0 10px var(--success); animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 28px; }
    .stat-card { background: rgba(11, 15, 25, 0.6); border: 1px solid var(--border); border-radius: 12px; padding: 16px; }
    .stat-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); font-weight: 600; margin-bottom: 6px; }
    .stat-value { font-size: 15px; font-weight: 600; color: #fff; }
    .endpoints { margin-bottom: 24px; }
    .endpoints h2 { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 12px; font-weight: 600; }
    .endpoint-list { display: flex; flex-direction: column; gap: 8px; }
    .endpoint-item { display: flex; align-items: center; justify-content: space-between; background: rgba(11, 15, 25, 0.4); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; text-decoration: none; color: var(--text); transition: border-color 0.2s; }
    .endpoint-item:hover { border-color: var(--primary); }
    .method { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; background: rgba(56, 189, 248, 0.2); color: var(--primary); }
    .path { font-family: monospace; font-size: 13px; }
    .footer { text-align: center; color: var(--text-muted); font-size: 12px; border-top: 1px solid var(--border); padding-top: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">🛡️</div>
      <div>
        <h1>Certified Backend Service</h1>
        <p class="subtitle">Digital Certificate Verification System &bull; Docker Container Node</p>
      </div>
    </div>
    
    <div class="status-badge">
      <span class="pulse"></span>
      Container Status: Active &amp; Operational
    </div>

    <div class="grid">
      <div class="stat-card">
        <div class="stat-label">Architecture</div>
        <div class="stat-value">Docker (Node.js 20 Alpine)</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Environment</div>
        <div class="stat-value">\${process.env.NODE_ENV || 'production'}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">WebSockets</div>
        <div class="stat-value">Socket.IO Enabled</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Health Check</div>
        <div class="stat-value" style="color: var(--success);">HTTP 200 OK</div>
      </div>
    </div>

    <div class="endpoints">
      <h2>Verified Service Endpoints</h2>
      <div class="endpoint-list">
        <a class="endpoint-item" href="/health" target="_blank">
          <span class="path">/health</span>
          <span class="method">GET &bull; JSON</span>
        </a>
        <a class="endpoint-item" href="/api/certificates/verify/CERT-1001" target="_blank">
          <span class="path">/api/certificates/verify/CERT-1001</span>
          <span class="method">GET &bull; Public</span>
        </a>
      </div>
    </div>

    <div class="footer">
      Experiment 10: Docker &amp; DevOps Deployment &bull; Certified System
    </div>
  </div>
</body>
</html>`);
  }

  res.json({
    name: 'Certified Backend Service',
    description: 'Digital Certificate Verification System API',
    status: 'online',
    container: 'docker',
    environment: process.env.NODE_ENV || 'development',
    healthCheck: '/health',
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Certified backend is healthy.',
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

const createServerInstance = () => {
  const server = http.createServer(app);
  initSocket(server, corsOrigins);
  return server;
};

const startServer = async () => {
  ensureJwtSecret();

  await connectDB();
  configureCloudinary();

  const server = createServerInstance();

  return server.listen(port, () => {
    console.log(`Certified backend with Socket.IO listening on port ${port}`);
  });
};

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start backend server:', error.message);
    process.exit(1);
  });
}

module.exports = { app, createServerInstance, startServer, ensureJwtSecret };
