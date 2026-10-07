import express from 'express';
import crypto from 'crypto';

import Booking from '../models/Booking.js';
import Complaint from '../models/Complaint.js';
import Review from '../models/Review.js';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendEmailAlert } from '../services/emailService.js';
import { sendInAppNotification } from '../services/notificationService.js';

const router = express.Router();

router.post('/ratings', protect, async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID and rating are required.' });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'Only completed bookings can be rated.' });
    }

    const isRider = String(booking.rider) === String(req.user._id);
    const isDriver = String(booking.driver) === String(req.user._id);
    if (!isRider && !isDriver) {
      return res.status(403).json({ success: false, message: 'You are not part of this booking.' });
    }

    const revieweeId = isRider ? booking.driver : booking.rider;
    const existingReview = await Review.findOne({ booking: bookingId, reviewer: req.user._id });
    if (existingReview) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this booking.' });
    }

    const review = await Review.create({
      booking: bookingId,
      ride: booking.ride,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating: Number(rating),
      comment: comment || ''
    });

    const reviewee = await User.findById(revieweeId);
    if (reviewee) {
      reviewee.ratingCount = Number(reviewee.ratingCount || 0) + 1;
      const currentTotal = Number(reviewee.averageRating || 0) * Number(reviewee.ratingCount - 1 || 0);
      reviewee.averageRating = Number(((currentTotal + Number(rating)) / reviewee.ratingCount).toFixed(1));
      await reviewee.save();
    }

    await sendInAppNotification({
      userId: revieweeId,
      title: 'New review received',
      message: `${req.user.name} left a ${rating}-star rating on your ride.`,
      type: 'success'
    });

    res.status(201).json({ success: true, review });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/complaints', protect, async (req, res) => {
  try {
    const { againstUser, rideId, category, description } = req.body;

    if (!description || !category) {
      return res.status(400).json({ success: false, message: 'Complaint category and description are required.' });
    }

    const complaint = await Complaint.create({
      complainant: req.user._id,
      againstUser: againstUser || null,
      ride: rideId || null,
      category,
      description,
      status: 'open'
    });

    await sendInAppNotification({
      userId: req.user._id,
      title: 'Complaint submitted',
      message: 'Your complaint has been recorded and sent to the admin team.',
      type: 'warning'
    });

    res.status(201).json({ success: true, complaint });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/pickup-otp', protect, authorize('driver'), async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (String(booking.driver) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only generate OTP for your own booking.' });
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000));
    booking.pickupOtp = otp;
    booking.status = 'ongoing';
    await booking.save();

    const rider = await User.findById(booking.rider);
    await sendInAppNotification({
      userId: booking.rider,
      title: 'Pickup OTP',
      message: `Your ride pickup code is ${otp}. Share it to start the trip.`,
      type: 'info'
    });

    if (rider?.email) {
      await sendEmailAlert({
        to: rider.email,
        subject: 'RideShare pickup OTP',
        text: `Your pickup OTP is ${otp}. Please share it to start the ride.`
      });
    }

    res.json({ success: true, otp, message: 'Pickup OTP generated and shared to the rider.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/verify-pickup-otp', protect, async (req, res) => {
  try {
    const { bookingId, otp } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isRider = String(booking.rider) === String(req.user._id);
    const isDriver = String(booking.driver) === String(req.user._id);

    if (!isRider && !isDriver) {
      return res.status(403).json({ success: false, message: 'You are not part of this trip.' });
    }

    if (!booking.pickupOtp || String(booking.pickupOtp) !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Pickup OTP is invalid or missing.' });
    }

    booking.status = 'ongoing';
    booking.tripRecord = {
      bookingId: booking._id,
      rider: booking.rider,
      driver: booking.driver,
      startedAt: new Date(),
      fare: booking.fare,
      routeSegment: {
        pickup: booking.pickup,
        drop: booking.drop,
        segmentKm: booking.segmentKm
      }
    };
    await booking.save();

    res.json({ success: true, message: 'Pickup OTP verified. Ride started.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/sos', protect, async (req, res) => {
  try {
    const { bookingId, latitude, longitude } = req.body;
    const booking = await Booking.findById(bookingId).populate('rider').populate('driver');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const isRider = String(booking.rider._id) === String(req.user._id);
    const isDriver = String(booking.driver._id) === String(req.user._id);
    if (!isRider && !isDriver) {
      return res.status(403).json({ success: false, message: 'You are not part of this ride.' });
    }

    booking.sosTriggered = true;
    await booking.save();

    const emergencyContact = booking.rider.emergencyContact || { name: 'Emergency Contact', phone: '0000000000' };
    const locationText = latitude && longitude ? `Latitude: ${latitude}, Longitude: ${longitude}` : 'Location unavailable';
    const message = `SOS ALERT: ${req.user.name} triggered an emergency during a ride. Current location: ${locationText}`;

    await sendEmailAlert({
      to: process.env.EMAIL_USER || 'admin@rideshare.local',
      subject: 'RideShare SOS alert',
      text: message
    });

    if (booking.rider?.emergencyContact?.phone) {
      console.log(`Emergency SMS/Phone alert to ${emergencyContact.name}: ${message}`);
    }

    await sendInAppNotification({
      userId: booking.driver,
      title: 'SOS alert',
      message: `SOS triggered for ride ${booking._id}.`,
      type: 'alert'
    });

    await sendInAppNotification({
      userId: booking.rider,
      title: 'SOS alert sent',
      message: 'Emergency contact and admin have been informed.',
      type: 'alert'
    });

    res.json({ success: true, message: 'SOS alert sent to emergency contact and admin.' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/share-link', protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const token = crypto.randomBytes(12).toString('hex');
    booking.shareToken = token;
    await booking.save();

    const publicUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/share/${token}`;
    res.json({ success: true, shareUrl: publicUrl });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/notifications', protect, async (req, res) => {
  const notifications = await (await import('../models/Notification.js')).default.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, notifications });
});

export default router;
