import express from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { generateMockKycOtp, verifyMockKycOtp } from '../services/mockKycProvider.js';

const router = express.Router();

router.post('/initiate', protect, async (req, res) => {
  try {
    const { aadhaarNumber, consent } = req.body;

    if (!aadhaarNumber || consent !== true) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number and consent checkbox are required.'
      });
    }

    const result = generateMockKycOtp(aadhaarNumber);

    res.json({
      success: true,
      provider: result.provider,
      referenceId: result.referenceId,
      otp: result.otp,
      message: result.message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.post('/verify', protect, async (req, res) => {
  try {
    const { aadhaarNumber, otp } = req.body;

    if (!aadhaarNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number and OTP are required.'
      });
    }

    const result = verifyMockKycOtp(aadhaarNumber, otp);
    if (!result.success) {
      return res.status(400).json(result);
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    user.kyc = {
      provider: result.provider,
      providerRef: result.referenceId,
      aadhaarLast4: result.maskedAadhaar.slice(-4),
      nameOnDocument: result.name,
      verified: true
    };
    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Aadhaar KYC verified successfully.',
      maskedAadhaar: result.maskedAadhaar,
      user: {
        name: user.name,
        role: user.role,
        kyc: user.kyc,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/status', protect, async (req, res) => {
  const user = await User.findById(req.user._id).select('kyc isVerified driverVerified');

  res.json({
    success: true,
    user: {
      isVerified: !!user?.isVerified,
      driverVerified: !!user?.driverVerified,
      kyc: user?.kyc || {}
    }
  });
});

router.post('/driver-document', protect, authorize('driver'), async (req, res) => {
  try {
    const { drivingLicenseNumber, vehicleRcNumber } = req.body;

    if (!drivingLicenseNumber || !vehicleRcNumber) {
      return res.status(400).json({
        success: false,
        message: 'Driving licence and vehicle RC are required.'
      });
    }

    const user = await User.findById(req.user._id);
    user.driverLicenseNumber = drivingLicenseNumber;
    user.vehicleRcNumber = vehicleRcNumber;
    user.driverVerificationStatus = 'pending_admin_approval';
    await user.save();

    res.json({
      success: true,
      message: 'Driver documents saved and sent for admin approval.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.get('/admin/pending', protect, authorize('admin'), async (req, res) => {
  const pendingDrivers = await User.find({
    role: 'driver',
    driverVerificationStatus: 'pending_admin_approval'
  }).select('name email driverLicenseNumber vehicleRcNumber kyc');

  res.json({
    success: true,
    count: pendingDrivers.length,
    drivers: pendingDrivers
  });
});

router.patch('/admin/approve/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user || user.role !== 'driver') {
      return res.status(404).json({
        success: false,
        message: 'Driver not found.'
      });
    }

    if (!user.kyc?.verified) {
      return res.status(400).json({
        success: false,
        message: 'Driver must complete Aadhaar verification before admin approval.'
      });
    }

    user.driverVerified = true;
    user.driverVerificationStatus = 'approved';
    user.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: 'Driver approved successfully.',
      driver: {
        id: user._id,
        name: user.name,
        driverVerified: user.driverVerified,
        driverVerificationStatus: user.driverVerificationStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
