import express from 'express';
import Booking from '../models/Booking.js';
import Ride from '../models/Ride.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import { createRazorpayOrder, verifyPaymentSignature, buildReceiptHtml } from '../services/paymentService.js';

const router = express.Router();

const calculatePricing = (fare) => {
  const commissionPercent = Number(process.env.PLATFORM_COMMISSION_PERCENT || 10);
  const commission = Number((fare * commissionPercent / 100).toFixed(2));
  const driverEarnings = Number((fare - commission).toFixed(2));
  return { commission, driverEarnings, platformFee: commission };
};

router.post('/create-order', protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId).populate('ride').populate('rider').populate('driver');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (String(booking.rider._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only pay for your own booking.' });
    }

    const fare = Number(booking.fare || 0);
    const pricing = calculatePricing(fare);
    booking.amount = fare;
    booking.platformFee = pricing.platformFee;
    booking.commission = pricing.commission;
    booking.driverEarnings = pricing.driverEarnings;

    const order = await createRazorpayOrder({
      amount: fare,
      receipt: `ride_${booking._id}`
    });

    booking.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status || 'created'
      },
      booking: {
        id: booking._id,
        fare: booking.fare,
        commission: booking.commission,
        driverEarnings: booking.driverEarnings,
        platformFee: booking.platformFee
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification details.' });
    }

    const booking = await Booking.findById(bookingId).populate('ride').populate('rider').populate('driver');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const signatureValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!signatureValid) {
      booking.paymentStatus = 'failed';
      await booking.save();

      return res.status(400).json({ success: false, message: 'Payment verification failed.' });
    }

    booking.paymentStatus = 'paid';
    booking.paymentMethod = 'razorpay';
    booking.razorpayPaymentId = razorpay_payment_id;
    booking.status = 'accepted';
    await booking.save();

    const receiptHtml = buildReceiptHtml({
      booking,
      ride: booking.ride,
      rider: booking.rider,
      driver: booking.driver
    });
    booking.receiptHtml = receiptHtml;
    await booking.save();

    res.json({
      success: true,
      message: 'Payment verified successfully.',
      booking: {
        id: booking._id,
        paymentStatus: booking.paymentStatus,
        amount: booking.amount,
        commission: booking.commission,
        driverEarnings: booking.driverEarnings
      }
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/cash', protect, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (String(booking.rider) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You can only pay for your own booking.' });
    }

    booking.paymentMethod = 'cash';
    booking.paymentStatus = 'paid';
    booking.status = 'accepted';
    await booking.save();

    res.json({ success: true, message: 'Cash payment selected and booking confirmed.', booking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post('/cancel', protect, async (req, res) => {
  try {
    const { bookingId, reason } = req.body;
    const booking = await Booking.findById(bookingId).populate('ride');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (String(booking.rider) !== String(req.user._id) && String(booking.driver) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not allowed to cancel this booking.' });
    }

    const departure = new Date(booking.ride.departureTime).getTime();
    const now = Date.now();
    const hoursLeft = (departure - now) / (1000 * 60 * 60);

    let refundAmount = 0;
    if (hoursLeft > 1) {
      refundAmount = Number(booking.amount || booking.fare || 0);
    } else if (hoursLeft > 0) {
      refundAmount = Number((booking.amount * 0.5 || booking.fare * 0.5 || 0).toFixed(2));
    }

    booking.paymentStatus = refundAmount > 0 ? 'refunded' : booking.paymentStatus;
    booking.refundAmount = refundAmount;
    booking.status = 'cancelled';
    booking.cancellationReason = reason || 'Cancelled by user';
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully.',
      refundAmount,
      policy: 'Free before 1 hour, partial refund after that, no refund after pickup.'
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get('/receipt/:bookingId', protect, async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('ride')
    .populate('rider', 'name email')
    .populate('driver', 'name email');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Receipt not found.' });
  }

  const receiptHtml = booking.receiptHtml || buildReceiptHtml({
    booking,
    ride: booking.ride,
    rider: booking.rider,
    driver: booking.driver
  });

  res.type('html').send(receiptHtml);
});

export default router;
