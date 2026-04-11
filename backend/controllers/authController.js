const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const generateToken = (userId) =>
  jwt.sign(
    {
      id: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d',
    },
  );

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  organization: user.organization,
  createdAt: user.createdAt,
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password, organization } = req.body;

  if (!name || !email || !password || !organization) {
    res.status(400);
    throw new Error('Name, email, password, and organization are required.');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long.');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409);
    throw new Error('User already exists with this email.');
  }

  const user = await User.create({
    name,
    email,
    password,
    organization,
    role: 'issuer',
  });

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required.');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials.');
  }

  const passwordMatch = await user.matchPassword(password);
  if (!passwordMatch) {
    res.status(401);
    throw new Error('Invalid credentials.');
  }

  const token = generateToken(user._id);

  res.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

const me = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: sanitizeUser(req.user),
  });
});

module.exports = {
  register,
  login,
  me,
};
