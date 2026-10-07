import Button from '../components/Button';
import Card from '../components/Card';

export default function ForgotPasswordPage() {
  return (
    <div className="page container">
      <div className="form-box">
        <Card title="Reset your password" subtitle="We will email you a reset link.">
          <div className="form-grid">
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" />
            </div>
            <Button>Send reset link</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
