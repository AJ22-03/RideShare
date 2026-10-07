import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const createToken = (user, type = 'access') => {
  const secret = type === 'refresh'
    ? (process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret')
    : (process.env.JWT_ACCESS_SECRET || 'dev-access-secret');

  return jwt.sign({ id: user._id, role: user.role }, secret, {
    expiresIn: type === 'refresh' ? '7d' : '1h'
  });
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isVerified: user.isVerified,
  driverVerified: user.driverVerified,
  profilePhoto: user.profilePhoto,
  emergencyContact: user.emergencyContact
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'User already exists with this email.' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      role: role || 'rider'
    });

    const accessToken = createToken(user, 'access');
    const refreshToken = createToken(user, 'refresh');

    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const accessToken = createToken(user, 'access');
    const refreshToken = createToken(user, 'refresh');

    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      user: sanitizeUser(user),
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token missing.' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret');
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token is invalid.' });
    }

    const newAccessToken = createToken(user, 'access');

    res.json({
      success: true,
      accessToken: newAccessToken
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Refresh token expired or invalid.' });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ success: true, user: sanitizeUser(req.user) });
});

router.post('/logout', protect, async (req, res) => {
  try {
    req.user.refreshToken = '';
    await req.user.save();

    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user found with this email.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = Date.now() + 15 * 60 * 1000;
    await user.save();

    const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    console.log(`Mock email sent to ${user.email}: ${resetLink}`);

    res.json({
      success: true,
      message: 'Password reset link generated. Check your mock email log in the backend console.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'Token and new password are required.' });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Password reset token is invalid or expired.' });
    }

    user.password = password;
    user.resetToken = '';
    user.resetTokenExpiry = null;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful. Please login again.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
