import Button from '../components/Button';
import Card from '../components/Card';

export default function KycPage() {
  return (
    <div className="container page">
      <h1>KYC verification</h1>
      <div className="form-box">
        <Card title="Verify your identity" subtitle="Your Aadhaar is never stored in full. Only the last 4 digits are kept.">
          <div className="form-grid">
            <div className="field">
              <label>Aadhaar number</label>
              <input type="text" placeholder="XXXX XXXX 1234" />
            </div>
            <div className="field">
              <label>OTP</label>
              <input type="text" placeholder="Enter 4-digit code" />
            </div>
            <label className="muted">
              <input type="checkbox" /> I agree to the privacy policy and consent to verification.
            </label>
            <Button>Verify KYC</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
