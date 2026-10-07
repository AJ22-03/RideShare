import { Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

const features = [
  'Partial-route lifts for bike and car rides',
  'Verified drivers, KYC and safety checks',
  'Instant cab matching and fare estimates',
  'Smart notifications and trip updates'
];

export default function HomePage() {
  return (
    <div className="container page">
      <section className="hero">
        <div className="hero-copy">
          <p className="muted">RideShare • Shared mobility for real routes</p>
          <h1>Share a ride. Save money. Travel smarter.</h1>
          <p>
            Book a lift from one stop to another, or post a full trip and let nearby riders join the route.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
            <Link to="/book-ride">
              <Button>Book a ride</Button>
            </Link>
            <Link to="/offer-ride">
              <Button variant="secondary">Offer a ride</Button>
            </Link>
          </div>
        </div>

        <div className="hero-panel">
          <h3>Search a trip</h3>
          <div className="search-grid">
            <div className="field">
              <label>Pickup</label>
              <input type="text" defaultValue="Kolhapur" />
            </div>
            <div className="field">
              <label>Drop</label>
              <input type="text" defaultValue="Pune" />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" defaultValue="2026-10-15" />
            </div>
            <div className="field">
              <label>Vehicle</label>
              <select defaultValue="bike">
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="cab">Cab</option>
              </select>
            </div>
            <div className="field full">
              <Button>Find rides</Button>
            </div>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <div className="grid-4">
          {features.map((feature) => (
            <Card key={feature} title={feature} subtitle="Built for practical, everyday travel.">
              <p className="muted">Better routes, clear pricing and safer trips.</p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
