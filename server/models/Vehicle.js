import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'cab'],
      required: true
    },
    brand: {
      type: String,
      trim: true
    },
    model: {
      type: String,
      trim: true
    },
    numberPlate: {
      type: String,
      trim: true,
      uppercase: true
    },
    seats: {
      type: Number,
      min: 1,
      max: 8,
      default: 1
    },
    registrationNumber: {
      type: String,
      trim: true
    },
    driverLicense: {
      type: String,
      trim: true
    },
    approved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);
export default Vehicle;
