const otpStore = new Map();

const normalizeAadhaar = (value = '') => String(value).replace(/\s+/g, '').replace(/[^\d]/g, '');

export const generateMockKycOtp = (aadhaarNumber) => {
  const digits = normalizeAadhaar(aadhaarNumber);

  if (!/^\d{12}$/.test(digits)) {
    throw new Error('Aadhaar number must be 12 digits.');
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  otpStore.set(digits, otp);

  return {
    provider: 'mock-digilocker',
    referenceId: `mock-kyc-${Date.now()}`,
    otp,
    message: 'Demo OTP generated. Use the OTP below for mock verification.'
  };
};

export const verifyMockKycOtp = (aadhaarNumber, otp) => {
  const digits = normalizeAadhaar(aadhaarNumber);
  const storedOtp = otpStore.get(digits);

  if (!storedOtp || storedOtp !== String(otp)) {
    return {
      success: false,
      message: 'OTP is incorrect or expired.'
    };
  }

  otpStore.delete(digits);

  return {
    success: true,
    provider: 'mock-digilocker',
    referenceId: `mock-kyc-${Date.now()}`,
    maskedAadhaar: `XXXX XXXX ${digits.slice(-4)}`,
    name: 'Mock KYC User'
  };
};
