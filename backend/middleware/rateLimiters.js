const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

const sharedConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
};

const authLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 15 * 60 * 1000,
  limit: 25,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
});

const verifyLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 10 * 60 * 1000,
  limit: 180,
  message: {
    success: false,
    message: 'Too many verification requests from this IP. Please retry shortly.',
  },
});

const issueLimiter = rateLimit({
  ...sharedConfig,
  windowMs: 10 * 60 * 1000,
  limit: 80,
  message: {
    success: false,
    message: 'Issuance rate limit reached. Please wait before issuing more certificates.',
  },
});

module.exports = {
  authLimiter,
  verifyLimiter,
  issueLimiter,
};
