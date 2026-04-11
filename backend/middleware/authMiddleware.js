const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  const authorizationHeader = req.headers.authorization || '';
  const token = authorizationHeader.startsWith('Bearer ') ? authorizationHeader.split(' ')[1] : null;

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
