import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: true
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    pickup: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    drop: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true
      }
    },
    pickupAtKm: {
      type: Number,
      default: 0
    },
    dropAtKm: {
      type: Number,
      default: 0
    },
    segmentKm: {
      type: Number,
      default: 0
    },
    fare: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
      default: 'pending'
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'razorpay'],
      default: 'cash'
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded', 'failed'],
      default: 'unpaid'
    },
    amount: {
      type: Number,
      default: 0
    },
    platformFee: {
      type: Number,
      default: 0
    },
    commission: {
      type: Number,
      default: 0
    },
    driverEarnings: {
      type: Number,
      default: 0
    },
    payoutStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    refundAmount: {
      type: Number,
      default: 0
    },
    cancellationPolicy: {
      type: String,
      default: 'free before 1 hour, partial after that, no refund after pickup'
    },
    razorpayOrderId: {
      type: String,
      default: ''
    },
    razorpayPaymentId: {
      type: String,
      default: ''
    },
    receiptHtml: {
      type: String,
      default: ''
    },
    pickupOtp: {
      type: String,
      default: ''
    },
    tripRecord: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    shareToken: {
      type: String,
      default: ''
    },
    sosTriggered: {
      type: Boolean,
      default: false
    },
    cancellationReason: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

bookingSchema.index({ pickup: '2dsphere', drop: '2dsphere' });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
