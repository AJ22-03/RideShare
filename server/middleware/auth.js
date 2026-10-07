import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token missing. Please login again.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'dev-access-secret');
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found for this token.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired access token.'
    });
  }
};

export const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Login required.'
    });
  }

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this resource.'
    });
  }

  next();
};

export const requireVerified = (req, res, next) => {
  if (!req.user || req.user.role !== 'driver' || !req.user.driverVerified) {
    return res.status(403).json({
      success: false,
      message: 'Driver verification is required before using this feature.'
    });
  }

  next();
};
