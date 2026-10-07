import crypto from 'crypto';
import Razorpay from 'razorpay';

const razorpay = (() => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });
})();

export const createRazorpayOrder = async ({ amount, currency = 'INR', receipt = 'receipt' }) => {
  if (!razorpay) {
    const orderId = `mock_order_${Date.now()}`;
    return {
      id: orderId,
      currency,
      amount: Math.round(Number(amount) * 100),
      receipt,
      status: 'created_in_test_mode'
    };
  }

  const order = await razorpay.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt
  });

  return order;
};

export const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'test_key_secret';
  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return generatedSignature === signature;
};

export const buildReceiptHtml = ({ booking, ride, rider, driver }) => {
  const amount = Number(booking.amount || 0).toFixed(2);
  const commission = Number(booking.commission || 0).toFixed(2);
  const driverEarnings = Number(booking.driverEarnings || 0).toFixed(2);
  const refund = Number(booking.refundAmount || 0).toFixed(2);

  return `
    <html>
      <body style="font-family: Arial; padding: 24px; color: #111827;">
        <h2>RideShare Receipt</h2>
        <p><strong>Booking ID:</strong> ${booking._id}</p>
        <p><strong>Rider:</strong> ${rider.name}</p>
        <p><strong>Driver:</strong> ${driver.name}</p>
        <p><strong>Ride:</strong> ${ride.from?.place || 'From'} to ${ride.to?.place || 'To'}</p>
        <p><strong>Segment:</strong> ${booking.segmentKm} km</p>
        <p><strong>Amount paid:</strong> ₹${amount}</p>
        <p><strong>Platform commission:</strong> ₹${commission}</p>
        <p><strong>Driver earnings:</strong> ₹${driverEarnings}</p>
        <p><strong>Refund issued:</strong> ₹${refund}</p>
      </body>
    </html>
  `;
};
