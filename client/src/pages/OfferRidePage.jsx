import Button from '../components/Button';
import Card from '../components/Card';

export default function OfferRidePage() {
  return (
    <div className="page container">
      <h1>Offer a ride</h1>
      <div className="form-box">
        <Card title="Trip details" subtitle="Post a route and let riders join nearby stops.">
          <div className="form-grid">
            <div className="field">
              <label>From</label>
              <input type="text" defaultValue="Kolhapur" />
            </div>
            <div className="field">
              <label>To</label>
              <input type="text" defaultValue="Pune" />
            </div>
            <div className="field">
              <label>Departure time</label>
              <input type="datetime-local" />
            </div>
            <div className="field">
              <label>Seats available</label>
              <input type="number" defaultValue="2" />
            </div>
            <div className="field">
              <label>Rate per km</label>
              <input type="number" defaultValue="7" />
            </div>
            <Button>Publish ride</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
