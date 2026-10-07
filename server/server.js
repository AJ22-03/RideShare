import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/authRoutes.js';
import kycRoutes from './routes/kycRoutes.js';
import rideRoutes from './routes/rideRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import trustRoutes from './routes/trustRoutes.js';
import { protect, authorize, requireVerified } from './middleware/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST']
  }
});

globalThis.io = io;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL || true,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' }
});
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'RideShare API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/trust', trustRoutes);

app.get('/api/protected-demo', protect, authorize('rider', 'driver', 'admin'), (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    }
  });
});

app.get('/api/driver-only', protect, requireVerified, (req, res) => {
  res.json({
    success: true,
    message: 'Driver verified area accessed successfully.',
    user: req.user.name
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server.'
  });
});

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rideshare';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch((error) => {
    console.error('MongoDB connection failed:', error.message);
  });

io.on('connection', (socket) => {
  console.log('A client connected to Socket.IO');

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('disconnect', () => {
    console.log('A client disconnected');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`RideShare server running on port ${PORT}`);
});

export { io };
