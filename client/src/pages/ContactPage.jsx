import Button from '../components/Button';
import Card from '../components/Card';

export default function ContactPage() {
  return (
    <div className="page container">
      <h1>Contact</h1>
      <div className="form-box">
        <Card title="Send us a message" subtitle="We help with support, safety and driver issues.">
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input type="text" placeholder="Your name" />
            </div>
            <div className="field">
              <label>Email</label>
              <input type="email" placeholder="you@example.com" />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea rows="5" placeholder="Tell us how we can help." />
            </div>
            <Button>Send message</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
