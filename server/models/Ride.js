import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
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
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: true
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'cab'],
      required: true
    },
    from: {
      place: String,
      location: pointSchema
    },
    to: {
      place: String,
      location: pointSchema
    },
    route: {
      type: {
        type: String,
        enum: ['LineString'],
        default: 'LineString'
      },
      coordinates: {
        type: [[Number]],
        default: []
      }
    },
    departureTime: {
      type: Date,
      required: true
    },
    seatsAvailable: {
      type: Number,
      min: 0,
      required: true
    },
    ratePerKm: {
      type: Number,
      min: 0,
      required: true
    },
    routeDistanceKm: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['open', 'scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'open'
    },
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

rideSchema.index({ route: '2dsphere' });
rideSchema.index({ 'from.location': '2dsphere', 'to.location': '2dsphere' });

const Ride = mongoose.model('Ride', rideSchema);
export default Ride;
