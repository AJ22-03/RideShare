import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 8
    },
    role: {
      type: String,
      enum: ['rider', 'driver', 'admin'],
      default: 'rider'
    },
    profilePhoto: {
      type: String,
      default: ''
    },
    emergencyContact: {
      name: String,
      phone: String
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0
    },
    driverVerified: {
      type: Boolean,
      default: false
    },
    driverLicenseNumber: {
      type: String,
      default: ''
    },
    vehicleRcNumber: {
      type: String,
      default: ''
    },
    driverVerificationStatus: {
      type: String,
      enum: ['not_started', 'pending_admin_approval', 'approved'],
      default: 'not_started'
    },
    kyc: {
      provider: String,
      providerRef: String,
      aadhaarLast4: String,
      nameOnDocument: String,
      verified: {
        type: Boolean,
        default: false
      }
    },
    refreshToken: {
      type: String,
      default: ''
    },
    resetToken: {
      type: String,
      default: ''
    },
    resetTokenExpiry: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
