import Button from '../components/Button';
import Card from '../components/Card';

export default function ProfilePage() {
  return (
    <div className="container page">
      <h1>Profile</h1>
      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <Card title="Personal details" subtitle="Driver and rider profile data.">
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input type="text" defaultValue="Aarav Patil" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="tel" defaultValue="+91 98765 43210" />
            </div>
            <div className="field">
              <label>Emergency contact</label>
              <input type="text" defaultValue="Mother • +91 99999 11111" />
            </div>
            <Button>Save profile</Button>
          </div>
        </Card>

        <Card title="Ride summary" subtitle="Your recent travel and verification status.">
          <p>Trips completed: 24</p>
          <p>Average rating: 4.8/5</p>
          <p>Verification: KYC approved</p>
        </Card>
      </div>
    </div>
  );
}
