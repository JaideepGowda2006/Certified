const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isDemoMode = () => process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE !== 'false';

const getDemoUser = async () => {
  const email = 'demo-issuer@truecert.local';
  let user = await User.findOne({ email }).select('-password');

  if (!user) {
    user = await User.create({
      name: 'Certified Demo Issuer',
      email,
      password: 'demo-password-not-for-login',
      role: 'admin',
      organization: 'Certified Demo Organization',
    });
  }

  return user;
};

const protect = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization || '';
  const token = authorizationHeader.startsWith('Bearer ') ? authorizationHeader.split(' ')[1] : null;

  if (!token && isDemoMode()) {
    try {
      req.user = await getDemoUser();
      next();
    } catch (error) {
      res.status(500);
      next(error);
    }
    return;
  }

  if (!token) {
    res.status(401);
    next(new Error('Not authorized. Token missing.'));
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401);
      next(new Error('Not authorized. User not found.'));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    const authError = new Error('Not authorized. Invalid token.');
    authError.cause = error;
    res.status(401);
    next(authError);
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    next(new Error('Forbidden. Insufficient role access.'));
    return;
  }

  next();
};

module.exports = {
  protect,
  authorizeRoles,
};
